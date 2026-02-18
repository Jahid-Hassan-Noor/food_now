from decimal import Decimal, InvalidOperation

from django.db.models import Avg, Count, Max, Min, Q
from rest_framework import status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from admin_app.models import Profile
from admin_app.serializers import FoodSerializer
from user_app.models import Chef, Food


SORT_MAP = {
    "newest": "-uid",
    "oldest": "uid",
    "name_asc": "food_name",
    "name_desc": "-food_name",
    "price_low": "food_price",
    "price_high": "-food_price",
}


def _require_profile(request):
    profile = Profile.objects.filter(user=request.user).first()
    if not profile:
        return None, Response({"message": "Profile not found"}, status=status.HTTP_404_NOT_FOUND)

    if profile.role not in ["chef", "admin"]:
        return None, Response(
            {"message": "You are not authorized to access this page"},
            status=status.HTTP_403_FORBIDDEN,
        )

    return profile, None


def _resolve_chef_username(request, profile):
    requested_chef = str(request.query_params.get("chef") or request.data.get("chef") or "").strip()

    if profile.role == "chef":
        return request.user.username

    if requested_chef:
        return requested_chef

    own_chef = Chef.objects.filter(chef_username__iexact=request.user.username).first()
    if own_chef:
        return own_chef.chef_username

    any_chef = Chef.objects.order_by("chef_username").first()
    if any_chef:
        return any_chef.chef_username

    return ""


def _parse_price(value):
    try:
        amount = Decimal(str(value).strip())
    except (InvalidOperation, TypeError, ValueError):
        return None
    if amount < 0:
        return None
    return float(amount)


def _food_summary(queryset):
    aggregate = queryset.aggregate(
        total_items=Count("uid"),
        avg_price=Avg("food_price"),
        min_price=Min("food_price"),
        max_price=Max("food_price"),
    )
    return {
        "total_items": int(aggregate.get("total_items") or 0),
        "avg_price": round(float(aggregate.get("avg_price") or 0.0), 2),
        "min_price": round(float(aggregate.get("min_price") or 0.0), 2),
        "max_price": round(float(aggregate.get("max_price") or 0.0), 2),
    }


def _assign_food_image(food, image_value):
    if image_value in (None, ""):
        return False

    # Multipart uploads arrive as UploadedFile objects.
    if hasattr(image_value, "read"):
        food.food_image = image_value
        return True

    image_text = str(image_value).strip()
    if image_text:
        food.food_image = image_text
        return True

    return False


class FoodInventoryListed(APIView):
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
                    "summary": {
                        "total_items": 0,
                        "avg_price": 0.0,
                        "min_price": 0.0,
                        "max_price": 0.0,
                    },
                    "foods": [],
                    "status": status.HTTP_200_OK,
                    "warning": "No chef profile found. Create a chef profile first.",
                }
            )

        search = str(request.query_params.get("search", "")).strip()
        sort_key = str(request.query_params.get("sort", "newest")).strip().lower() or "newest"
        order_by = SORT_MAP.get(sort_key, "-uid")

        foods_qs = Food.objects.filter(chef__iexact=chef_username)
        if search:
            foods_qs = foods_qs.filter(
                Q(food_name__icontains=search) | Q(food_description__icontains=search)
            )

        foods_qs = foods_qs.order_by(order_by)

        return Response(
            {
                "chef": chef_username,
                "filters": {
                    "search": search,
                    "sort": sort_key,
                },
                "summary": _food_summary(foods_qs),
                "foods": FoodSerializer(foods_qs, many=True).data,
                "status": status.HTTP_200_OK,
            }
        )


class FoodInventoryCreate(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request):
        profile, profile_error = _require_profile(request)
        if profile_error:
            return profile_error

        chef_username = _resolve_chef_username(request, profile)
        if not chef_username:
            return Response(
                {"message": "Chef profile not found. Unable to add food."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        food_name = str(request.data.get("food_name", "")).strip()
        food_description = str(request.data.get("food_description", "")).strip()
        price = _parse_price(request.data.get("food_price", ""))

        if not food_name:
            return Response({"message": "Food name is required."}, status=status.HTTP_400_BAD_REQUEST)
        if price is None:
            return Response(
                {"message": "food_price must be a valid non-negative number."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        food = Food(
            food_name=food_name,
            food_description=food_description,
            chef=chef_username,
            food_price=price,
        )

        _assign_food_image(food, request.data.get("food_image"))

        food.save()

        return Response(
            {
                "message": "Food item added successfully.",
                "food": FoodSerializer(food).data,
                "status": status.HTTP_201_CREATED,
            },
            status=status.HTTP_201_CREATED,
        )


class FoodInventoryItem(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def _get_food(self, request, profile, food_id):
        queryset = Food.objects.filter(pk=food_id)

        # Chef can only manage their own foods.
        if profile.role == "chef":
            queryset = queryset.filter(chef__iexact=request.user.username)

        return queryset.first()

    def patch(self, request, food_id):
        profile, profile_error = _require_profile(request)
        if profile_error:
            return profile_error

        food = self._get_food(request, profile, food_id)
        if not food:
            return Response({"message": "Food item not found."}, status=status.HTTP_404_NOT_FOUND)

        update_fields = []

        if "food_name" in request.data:
            next_name = str(request.data.get("food_name", "")).strip()
            if not next_name:
                return Response({"message": "Food name cannot be empty."}, status=status.HTTP_400_BAD_REQUEST)
            food.food_name = next_name
            update_fields.append("food_name")

        if "food_description" in request.data:
            food.food_description = str(request.data.get("food_description", "")).strip()
            update_fields.append("food_description")

        if "food_price" in request.data:
            price = _parse_price(request.data.get("food_price", ""))
            if price is None:
                return Response(
                    {"message": "food_price must be a valid non-negative number."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            food.food_price = price
            update_fields.append("food_price")

        if "food_image" in request.data:
            if _assign_food_image(food, request.data.get("food_image")):
                update_fields.append("food_image")

        if not update_fields:
            return Response(
                {"message": "No valid fields provided for update."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        food.save(update_fields=update_fields)

        return Response(
            {
                "message": "Food item updated successfully.",
                "food": FoodSerializer(food).data,
                "status": status.HTTP_200_OK,
            }
        )

    def delete(self, request, food_id):
        profile, profile_error = _require_profile(request)
        if profile_error:
            return profile_error

        food = self._get_food(request, profile, food_id)
        if not food:
            return Response({"message": "Food item not found."}, status=status.HTTP_404_NOT_FOUND)

        food.delete()
        return Response(
            {
                "message": "Food item deleted successfully.",
                "status": status.HTTP_200_OK,
            }
        )
