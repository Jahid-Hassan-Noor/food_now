from datetime import datetime, timedelta

from django.db.models import Q
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from admin_app.models import Profile
from admin_app.serializers import CampaignSerializer, FoodSerializer
from user_app.models import Campaign, Campaign_history, Chef, Food


RANGE_LABELS = {
    "today": "Today",
    "7d": "Last 7 Days",
    "30d": "Last 30 Days",
    "month": "This Month",
    "custom": "Custom Range",
}


def _safe_date_parse(value):
    if not value:
        return None
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except (TypeError, ValueError):
        return None


def _safe_datetime_parse(value):
    if not value:
        return None

    text = str(value).strip()
    if not text:
        return None

    try:
        parsed = datetime.fromisoformat(text.replace("Z", "+00:00"))
    except ValueError:
        return None

    if timezone.is_naive(parsed):
        parsed = timezone.make_aware(parsed, timezone.get_current_timezone())
    return parsed


def _resolve_range(range_key=None, start_date_raw=None, end_date_raw=None):
    today = timezone.localdate()
    normalized = str(range_key or "30d").strip().lower()

    if normalized == "today":
        start_date, end_date = today, today
    elif normalized == "7d":
        start_date, end_date = today - timedelta(days=6), today
    elif normalized == "30d":
        start_date, end_date = today - timedelta(days=29), today
    elif normalized == "month":
        start_date, end_date = today.replace(day=1), today
    elif normalized == "custom":
        start_date = _safe_date_parse(start_date_raw)
        end_date = _safe_date_parse(end_date_raw)
        if not start_date or not end_date:
            return None, {"detail": "For custom range, start_date and end_date are required (YYYY-MM-DD)."}
    else:
        return None, {"detail": "Invalid range. Use: today, 7d, 30d, month, custom."}

    if start_date > end_date:
        return None, {"detail": "start_date cannot be after end_date."}

    span = (end_date - start_date).days + 1
    if span > 366:
        return None, {"detail": "Date range is too large. Please use 366 days or fewer."}

    return (
        {
            "key": normalized,
            "label": RANGE_LABELS.get(normalized, "Custom Range"),
            "start_date": start_date,
            "end_date": end_date,
        },
        None,
    )


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

    own = Chef.objects.filter(chef_username__iexact=request.user.username).first()
    if own:
        return own.chef_username

    any_chef = Chef.objects.order_by("chef_username").first()
    if any_chef:
        return any_chef.chef_username

    return ""


def _campaign_food_details(campaign):
    food_items = []
    food_quantities = campaign.food_items or {}
    for food_id, quantity in food_quantities.items():
        food = Food.objects.filter(pk=food_id).first()
        if not food:
            food_items.append(
                {
                    "uid": str(food_id),
                    "food_name": "Unknown Food",
                    "food_price": 0,
                    "campaign_quantity": int(quantity or 0),
                }
            )
            continue

        data = FoodSerializer(food).data
        data["campaign_quantity"] = int(quantity or 0)
        food_items.append(data)

    return food_items


def _serialize_campaign_with_foods(campaign):
    campaign_data = CampaignSerializer(campaign).data
    campaign_data["food_items"] = _campaign_food_details(campaign)
    campaign_data["id"] = str(campaign.uid)
    return campaign_data


class CampaignDetails(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, campaign_id):
        try:
            campaign = Campaign.objects.get(pk=campaign_id)
        except Campaign.DoesNotExist:
            return Response({"message": "Campaign not found"}, status=status.HTTP_404_NOT_FOUND)

        return Response(
            {
                "campaign": _serialize_campaign_with_foods(campaign),
                "status": status.HTTP_200_OK,
            }
        )


class CampaignCurrent(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile, profile_error = _require_profile(request)
        if profile_error:
            return profile_error

        chef_username = _resolve_chef_username(request, profile)
        if not chef_username:
            return Response(
                {
                    "campaigns": [],
                    "summary": {
                        "total_current": 0,
                        "running_now": 0,
                        "scheduled": 0,
                        "ending_today": 0,
                    },
                    "status": status.HTTP_200_OK,
                }
            )

        now = timezone.now()
        current_qs = (
            Campaign.objects.filter(chef__iexact=chef_username)
            .filter(Q(end_time__isnull=True) | Q(end_time__gte=now))
            .exclude(status__in=["completed", "cancelled", "expired", "ended"])
            .order_by("-start_time")
        )

        campaigns = [_serialize_campaign_with_foods(campaign) for campaign in current_qs]

        today = timezone.localdate()
        summary = {
            "total_current": len(campaigns),
            "running_now": sum(1 for campaign in campaigns if campaign.get("start_time") and campaign.get("status") == "running"),
            "scheduled": sum(
                1
                for campaign in campaigns
                if campaign.get("start_time")
                and _safe_datetime_parse(campaign.get("start_time"))
                and _safe_datetime_parse(campaign.get("start_time")) > now
            ),
            "ending_today": sum(
                1
                for campaign in campaigns
                if campaign.get("end_time")
                and _safe_datetime_parse(campaign.get("end_time"))
                and _safe_datetime_parse(campaign.get("end_time")).date() == today
            ),
        }

        return Response(
            {
                "chef": chef_username,
                "summary": summary,
                "campaigns": campaigns,
                "status": status.HTTP_200_OK,
            }
        )


class CampaignCurrentAction(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, campaign_id):
        profile, profile_error = _require_profile(request)
        if profile_error:
            return profile_error

        try:
            campaign = Campaign.objects.get(pk=campaign_id)
        except Campaign.DoesNotExist:
            return Response({"message": "Campaign not found"}, status=status.HTTP_404_NOT_FOUND)

        if profile.role == "chef" and campaign.chef.lower() != request.user.username.lower():
            return Response(
                {"message": "You can only update your own campaigns."},
                status=status.HTTP_403_FORBIDDEN,
            )

        action = str(request.data.get("action", "")).strip().lower()
        if action not in ["end", "cancel", "resume"]:
            return Response(
                {"message": "Invalid action. Use end, cancel, or resume."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        now = timezone.now()
        if action == "end":
            campaign.status = "completed"
            if campaign.end_time is None or campaign.end_time > now:
                campaign.end_time = now
        elif action == "cancel":
            campaign.status = "cancelled"
            if campaign.end_time is None:
                campaign.end_time = now
        elif action == "resume":
            campaign.status = "running"
            if campaign.end_time and campaign.end_time < now:
                campaign.end_time = None

        campaign.save(update_fields=["status", "end_time", "updated_at"])

        return Response(
            {
                "message": f"Campaign {action}ed successfully.",
                "campaign": _serialize_campaign_with_foods(campaign),
                "status": status.HTTP_200_OK,
            }
        )


class CampaignCreate(APIView):
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
                    "foods": [],
                    "status": status.HTTP_200_OK,
                    "warning": "No chef profile found. Create a chef profile first.",
                }
            )

        foods = Food.objects.filter(chef__iexact=chef_username).order_by("food_name")
        foods_data = FoodSerializer(foods, many=True).data

        return Response(
            {
                "chef": chef_username,
                "foods": foods_data,
                "status": status.HTTP_200_OK,
            }
        )

    def post(self, request):
        profile, profile_error = _require_profile(request)
        if profile_error:
            return profile_error

        chef_username = _resolve_chef_username(request, profile)
        if not chef_username:
            return Response(
                {"message": "Chef not found. Unable to create campaign."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        title = str(request.data.get("title", "")).strip()
        description = str(request.data.get("campaign_description", "")).strip()
        if not title:
            return Response({"message": "Campaign title is required."}, status=status.HTTP_400_BAD_REQUEST)

        start_time = _safe_datetime_parse(request.data.get("start_time")) or timezone.now()
        end_time = _safe_datetime_parse(request.data.get("end_time"))
        delivery_time = _safe_datetime_parse(request.data.get("delivery_time"))

        if end_time and end_time < start_time:
            return Response(
                {"message": "End time cannot be earlier than start time."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        food_items_payload = request.data.get("food_items") or []
        if not isinstance(food_items_payload, list) or not food_items_payload:
            return Response(
                {"message": "food_items must be a non-empty list."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        allowed_foods = {
            str(food.uid): food
            for food in Food.objects.filter(chef__iexact=chef_username)
        }
        if not allowed_foods:
            return Response(
                {"message": "No foods found for this chef. Add foods before creating campaigns."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        food_quantity_map = {}
        for item in food_items_payload:
            if not isinstance(item, dict):
                return Response(
                    {"message": "Each food item must be an object with food_id and quantity."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            food_id = str(item.get("food_id", "")).strip()
            quantity_raw = item.get("quantity", 0)
            try:
                quantity = int(quantity_raw)
            except (TypeError, ValueError):
                quantity = 0

            if not food_id or food_id not in allowed_foods:
                return Response(
                    {"message": f"Invalid food_id: {food_id}"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if quantity <= 0:
                return Response(
                    {"message": f"Quantity must be greater than 0 for food {food_id}."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            food_quantity_map[food_id] = food_quantity_map.get(food_id, 0) + quantity

        quantity_available = int(sum(food_quantity_map.values()))
        status_value = str(request.data.get("status", "running")).strip().lower() or "running"
        food_status = str(request.data.get("food_status", "cooking")).strip().lower() or "cooking"

        campaign = Campaign.objects.create(
            chef=chef_username,
            status=status_value,
            food_status=food_status,
            title=title,
            campaign_description=description,
            food_items=food_quantity_map,
            start_time=start_time,
            end_time=end_time,
            delivery_time=delivery_time,
            quantity_available=quantity_available,
            total_orders=0,
        )

        chef_obj = Chef.objects.filter(chef_username__iexact=chef_username).first()
        if chef_obj:
            chef_obj.total_campaigns = int(chef_obj.total_campaigns or 0) + 1
            chef_obj.save(update_fields=["total_campaigns", "updated_at"])

        return Response(
            {
                "message": "Campaign created successfully.",
                "campaign": _serialize_campaign_with_foods(campaign),
                "status": status.HTTP_201_CREATED,
            },
            status=status.HTTP_201_CREATED,
        )


class CampaignHistory(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile, profile_error = _require_profile(request)
        if profile_error:
            return profile_error

        range_info, range_error = _resolve_range(
            range_key=request.query_params.get("range", "30d"),
            start_date_raw=request.query_params.get("start_date"),
            end_date_raw=request.query_params.get("end_date"),
        )
        if range_error:
            return Response(range_error, status=status.HTTP_400_BAD_REQUEST)

        chef_username = _resolve_chef_username(request, profile)
        if not chef_username:
            return Response(
                {
                    "range": {
                        "key": range_info["key"],
                        "label": range_info["label"],
                        "start_date": range_info["start_date"].isoformat(),
                        "end_date": range_info["end_date"].isoformat(),
                    },
                    "summary": {
                        "total_campaigns": 0,
                        "completed_campaigns": 0,
                        "cancelled_campaigns": 0,
                        "total_orders": 0,
                    },
                    "campaigns": [],
                    "status": status.HTTP_200_OK,
                }
            )

        start_date = range_info["start_date"]
        end_date = range_info["end_date"]
        now = timezone.now()

        current_history_qs = (
            Campaign.objects.filter(chef__iexact=chef_username)
            .filter(
                Q(status__in=["completed", "cancelled", "expired", "ended"])
                | Q(end_time__lt=now)
            )
            .filter(start_time__date__gte=start_date, start_time__date__lte=end_date)
            .order_by("-start_time")
        )

        legacy_history_qs = Campaign_history.objects.filter(
            chef__iexact=chef_username,
            start_time__date__gte=start_date,
            start_time__date__lte=end_date,
        ).order_by("-start_time")

        campaigns = []
        seen_ids = set()

        for campaign in current_history_qs:
            serialized = _serialize_campaign_with_foods(campaign)
            serialized["source"] = "campaign"
            campaigns.append(serialized)
            seen_ids.add(str(campaign.uid))

        for campaign in legacy_history_qs:
            legacy_id = str(campaign.uid)
            if legacy_id in seen_ids:
                continue
            campaigns.append(
                {
                    "id": legacy_id,
                    "uid": legacy_id,
                    "chef": campaign.chef,
                    "title": campaign.title,
                    "campaign_description": campaign.campaign_description,
                    "status": campaign.status,
                    "start_time": campaign.start_time,
                    "end_time": campaign.end_time,
                    "delivery_time": campaign.delivery_time,
                    "quantity_available": 0,
                    "total_orders": int(campaign.total_orders or 0),
                    "food_items": [],
                    "source": "campaign_history",
                }
            )

        epoch_floor = timezone.make_aware(datetime(1970, 1, 1), timezone.get_current_timezone())
        campaigns = sorted(
            campaigns,
            key=lambda item: _safe_datetime_parse(item.get("start_time")) or epoch_floor,
            reverse=True,
        )

        summary = {
            "total_campaigns": len(campaigns),
            "completed_campaigns": sum(1 for c in campaigns if str(c.get("status", "")).lower() in ["completed", "ended", "expired"]),
            "cancelled_campaigns": sum(1 for c in campaigns if str(c.get("status", "")).lower() == "cancelled"),
            "total_orders": int(sum(int(c.get("total_orders") or 0) for c in campaigns)),
        }

        return Response(
            {
                "chef": chef_username,
                "range": {
                    "key": range_info["key"],
                    "label": range_info["label"],
                    "start_date": start_date.isoformat(),
                    "end_date": end_date.isoformat(),
                },
                "summary": summary,
                "campaigns": campaigns,
                "status": status.HTTP_200_OK,
            }
        )
