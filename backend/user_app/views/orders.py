import json

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from user_app.models import Food, Order
from admin_app.serializers import FoodSerializer, OrderSerializer


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

class UserOrders(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request):
		user = request.user
		orders = Order.objects.filter(user=user.username).order_by('-order_time')

		order_rows = []
		food_ids_all = set()
		for order in orders:
			order_data = OrderSerializer(order).data
			food_ids = _parse_food_ids(order.food_items)
			food_ids_all.update(food_ids)
			order_rows.append((order, order_data, food_ids))

		food_map = {
			str(food.uid): FoodSerializer(food).data
			for food in Food.objects.filter(uid__in=list(food_ids_all))
		}

		orders_data = []
		total_amount = 0.0
		total_items = 0
		for order, order_data, food_ids in order_rows:
			detailed_items = [food_map[fid] for fid in food_ids if fid in food_map]
			order_data['food_items_details'] = detailed_items
			orders_data.append(order_data)

			total_amount += _to_float(order.food_price)
			quantity = _to_int(order.quantity)
			total_items += quantity if quantity > 0 else max(len(food_ids), 1)

		return Response({
			'orders': orders_data,
			'summary': {
				'total_orders': len(orders_data),
				'total_amount': round(total_amount, 2),
				'total_items': int(total_items),
			},
			'status': status.HTTP_200_OK,
		})
