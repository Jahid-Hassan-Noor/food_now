import json

from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from admin_app.models import Profile
from admin_app.serializers import FoodSerializer, OrderSerializer, Order_historySerializer
from user_app.models import Chef, Food, Order, Order_history


ALLOWED_ROLES = {"chef", "admin"}


def _require_profile(request):
	profile = Profile.objects.filter(user=request.user).first()
	if not profile:
		return None, Response({"message": "Profile not found"}, status=status.HTTP_404_NOT_FOUND)

	if profile.role not in ALLOWED_ROLES:
		return None, Response(
			{"message": "You are not authorized to access this page"},
			status=status.HTTP_403_FORBIDDEN,
		)

	return profile, None


def _resolve_chef_username(request, profile):
	if profile.role == "chef":
		return request.user.username

	requested_chef = str(
		request.query_params.get("chef")
		or request.data.get("chef")
		or ""
	).strip()
	if requested_chef:
		return requested_chef

	own_chef = Chef.objects.filter(chef_username__iexact=request.user.username).first()
	if own_chef:
		return own_chef.chef_username

	first_chef = Chef.objects.order_by("chef_username").first()
	return first_chef.chef_username if first_chef else ""


def _parse_food_ids(food_items_raw):
	if not food_items_raw:
		return []

	raw = str(food_items_raw).strip()
	if not raw:
		return []

	if raw.startswith("[") or raw.startswith("{"):
		try:
			parsed = json.loads(raw)
			if isinstance(parsed, list):
				return [str(item).strip() for item in parsed if str(item).strip()]
			if isinstance(parsed, dict):
				return [str(item).strip() for item in parsed.keys() if str(item).strip()]
		except Exception:
			pass

	return [item.strip() for item in raw.split(",") if item.strip()]


def _to_float(value):
	try:
		return float(value or 0.0)
	except Exception:
		return 0.0


def _to_int(value):
	try:
		return int(value or 0)
	except Exception:
		return 0


def _build_food_maps(chef_username):
	foods = Food.objects.filter(chef__iexact=chef_username).order_by("food_name")
	food_map = {
		str(food.uid): food
		for food in foods
	}
	serialized_map = {
		food_id: FoodSerializer(food).data
		for food_id, food in food_map.items()
	}
	return food_map, serialized_map


def _serialize_order_with_matches(order, serialized_food_map, matched_food_ids):
	order_data = OrderSerializer(order).data
	order_data["food_item_ids"] = _parse_food_ids(order.food_items)
	order_data["matched_food_item_ids"] = matched_food_ids
	order_data["matched_food_items_details"] = [
		serialized_food_map[food_id] for food_id in matched_food_ids if food_id in serialized_food_map
	]
	return order_data


def _serialize_history_with_matches(order, serialized_food_map, matched_food_ids):
	order_data = Order_historySerializer(order).data
	order_data["food_item_ids"] = _parse_food_ids(order.food_items)
	order_data["matched_food_item_ids"] = matched_food_ids
	order_data["matched_food_items_details"] = [
		serialized_food_map[food_id] for food_id in matched_food_ids if food_id in serialized_food_map
	]
	return order_data


def _filter_orders_for_chef(queryset, chef_food_ids):
	rows = []
	for order in queryset:
		order_food_ids = _parse_food_ids(order.food_items)
		matched = [food_id for food_id in order_food_ids if food_id in chef_food_ids]
		if matched:
			rows.append((order, matched))
	return rows


class CampaignOrdersPending(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request):
		profile, profile_error = _require_profile(request)
		if profile_error:
			return profile_error

		chef_username = _resolve_chef_username(request, profile)
		if not chef_username:
			return Response(
				{
					"chef": "",
					"orders": [],
					"summary": {
						"total_orders": 0,
						"total_amount": 0.0,
						"total_items": 0,
					},
					"status": status.HTTP_200_OK,
				}
			)

		_food_map, serialized_food_map = _build_food_maps(chef_username)
		chef_food_ids = set(serialized_food_map.keys())
		if not chef_food_ids:
			return Response(
				{
					"chef": chef_username,
					"orders": [],
					"summary": {
						"total_orders": 0,
						"total_amount": 0.0,
						"total_items": 0,
					},
					"status": status.HTTP_200_OK,
				}
			)

		order_rows = _filter_orders_for_chef(Order.objects.all().order_by("-order_time"), chef_food_ids)

		orders_data = []
		total_amount = 0.0
		total_items = 0
		for order, matched_food_ids in order_rows:
			orders_data.append(_serialize_order_with_matches(order, serialized_food_map, matched_food_ids))
			total_amount += _to_float(order.food_price)
			quantity = _to_int(order.quantity)
			total_items += quantity if quantity > 0 else max(len(matched_food_ids), 1)

		return Response(
			{
				"chef": chef_username,
				"orders": orders_data,
				"summary": {
					"total_orders": len(orders_data),
					"total_amount": round(total_amount, 2),
					"total_items": int(total_items),
				},
				"status": status.HTTP_200_OK,
			}
		)


class CampaignOrdersPendingAction(APIView):
	permission_classes = [IsAuthenticated]

	def patch(self, request, order_id):
		profile, profile_error = _require_profile(request)
		if profile_error:
			return profile_error

		chef_username = _resolve_chef_username(request, profile)
		if not chef_username:
			return Response({"message": "Chef profile not found"}, status=status.HTTP_404_NOT_FOUND)

		order = Order.objects.filter(pk=order_id).first()
		if not order:
			return Response({"message": "Pending order not found."}, status=status.HTTP_404_NOT_FOUND)

		food_map, _serialized_food_map = _build_food_maps(chef_username)
		chef_food_ids = set(food_map.keys())
		order_food_ids = _parse_food_ids(order.food_items)
		matched_food_ids = [food_id for food_id in order_food_ids if food_id in chef_food_ids]
		if not matched_food_ids:
			return Response(
				{"message": "You are not authorized to update this order."},
				status=status.HTTP_403_FORBIDDEN,
			)

		action = str(request.data.get("action", "")).strip().lower()
		if action not in {"complete"}:
			return Response(
				{"message": "Invalid action. Use complete."},
				status=status.HTTP_400_BAD_REQUEST,
			)

		history = Order_history.objects.create(
			user=order.user,
			quantity=order.quantity,
			food_items=order.food_items,
			food_price=order.food_price,
			order_id=str(order.uid),
		)
		if order.order_time:
			Order_history.objects.filter(pk=history.pk).update(order_time=order.order_time)
			history.order_time = order.order_time

		chef_obj = Chef.objects.filter(chef_username__iexact=chef_username).first()
		if chef_obj:
			chef_obj.total_orders_received = _to_int(chef_obj.total_orders_received) + max(_to_int(order.quantity), 1)
			chef_obj.save(update_fields=["total_orders_received"])

		order.delete()

		return Response(
			{
				"message": "Order marked as completed and moved to history.",
				"history_order": Order_historySerializer(history).data,
				"completed_at": timezone.now(),
				"status": status.HTTP_200_OK,
			}
		)


class CampaignOrdersHistory(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request):
		profile, profile_error = _require_profile(request)
		if profile_error:
			return profile_error

		chef_username = _resolve_chef_username(request, profile)
		if not chef_username:
			return Response(
				{
					"chef": "",
					"order_history": [],
					"summary": {
						"total_orders": 0,
						"total_amount": 0.0,
						"total_items": 0,
					},
					"status": status.HTTP_200_OK,
				}
			)

		_food_map, serialized_food_map = _build_food_maps(chef_username)
		chef_food_ids = set(serialized_food_map.keys())
		if not chef_food_ids:
			return Response(
				{
					"chef": chef_username,
					"order_history": [],
					"summary": {
						"total_orders": 0,
						"total_amount": 0.0,
						"total_items": 0,
					},
					"status": status.HTTP_200_OK,
				}
			)

		history_rows = _filter_orders_for_chef(Order_history.objects.all().order_by("-order_time"), chef_food_ids)

		orders_data = []
		total_amount = 0.0
		total_items = 0
		for order, matched_food_ids in history_rows:
			orders_data.append(_serialize_history_with_matches(order, serialized_food_map, matched_food_ids))
			total_amount += _to_float(order.food_price)
			quantity = _to_int(order.quantity)
			total_items += quantity if quantity > 0 else max(len(matched_food_ids), 1)

		return Response(
			{
				"chef": chef_username,
				"order_history": orders_data,
				"summary": {
					"total_orders": len(orders_data),
					"total_amount": round(total_amount, 2),
					"total_items": int(total_items),
				},
				"status": status.HTTP_200_OK,
			}
		)
