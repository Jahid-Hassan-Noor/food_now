from datetime import date, datetime, timedelta
import json

from django.db.models import Q
from django.db.models import Count
from django.db.models.functions import TruncDate
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from admin_app.models import Profile
from user_app.models import Campaign, Chef, Food, Order


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

    day_span = (end_date - start_date).days + 1
    if day_span > 366:
        return None, {"detail": "Date range is too large. Please use 366 days or fewer."}

    return (
        {
            "key": normalized,
            "label": RANGE_LABELS.get(normalized, "Custom Range"),
            "start_date": start_date,
            "end_date": end_date,
            "day_span": day_span,
        },
        None,
    )


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


def _empty_dashboard_payload(range_info, role, warning_message=None):
    start_date = range_info["start_date"]
    end_date = range_info["end_date"]
    day_span = range_info["day_span"]
    labels = [(start_date + timedelta(days=idx)).isoformat() for idx in range(day_span)]
    zeros = [0 for _ in range(day_span)]
    month_labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    payload = {
        "range": {
            "key": range_info["key"],
            "label": range_info["label"],
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
        },
        "chef": {
            "username": "",
            "requested_by_role": role,
            "is_self": False,
            "fallback_used": False,
        },
        "summary": {
            "balance": 0.0,
            "campaign_points": 0,
            "subscription_status": "N/A",
            "active_campaigns": 0,
            "campaigns_in_range": 0,
            "orders_in_range": 0,
            "revenue_in_range": 0.0,
            "avg_order_value": 0.0,
            "lifetime_total_orders": 0,
            "lifetime_total_campaigns": 0,
        },
        "trends": {
            "labels": labels,
            "campaigns_per_day": zeros,
            "orders_per_day": zeros,
            "revenue_per_day": [0.0 for _ in range(day_span)],
        },
        "yearly_revenue": {
            "year": end_date.year,
            "labels": month_labels,
            "revenue_per_month": [0.0 for _ in month_labels],
        },
        "top_performers": {
            "campaigns": [],
            "foods": [],
        },
        "metrices": {
            "balance": 0.0,
            "total_orders_received": 0,
            "total_campaigns": 0,
            "campaign_points": 0,
        },
        "status": status.HTTP_200_OK,
    }
    if warning_message:
        payload["warning"] = warning_message
    return payload


class chef_dashboard(APIView):
    permission_classes = [IsAuthenticated]

    @staticmethod
    def _to_float(value):
        return float(value or 0.0)

    def get(self, request):
        user = request.user
        profile = Profile.objects.filter(user=user).first()
        if not profile:
            return Response({"message": "Profile not found"}, status=status.HTTP_404_NOT_FOUND)

        if profile.role not in ["chef", "admin"]:
            return Response(
                {"message": "You are not authorized to access this page"},
                status=status.HTTP_403_FORBIDDEN,
            )

        range_info, range_error = _resolve_range(
            range_key=request.query_params.get("range", "30d"),
            start_date_raw=request.query_params.get("start_date"),
            end_date_raw=request.query_params.get("end_date"),
        )
        if range_error:
            return Response(range_error, status=status.HTTP_400_BAD_REQUEST)

        requested_chef = str(request.query_params.get("chef", "")).strip()

        def find_chef(username):
            if not username:
                return None
            return Chef.objects.filter(chef_username=username).first() or Chef.objects.filter(
                chef_username__iexact=username
            ).first()

        chef = None
        fallback_used = False

        if profile.role == "chef":
            chef = find_chef(user.username)
        else:
            if requested_chef:
                chef = find_chef(requested_chef)
                if not chef:
                    return Response(
                        {"message": f"Chef '{requested_chef}' not found"},
                        status=status.HTTP_404_NOT_FOUND,
                    )
            if not chef:
                chef = find_chef(user.username)
            if not chef:
                chef = Chef.objects.order_by("chef_username").first()
                fallback_used = bool(chef)

        if not chef:
            if profile.role == "admin":
                return Response(
                    _empty_dashboard_payload(
                        range_info,
                        role=profile.role,
                        warning_message="No chef profiles found. Create at least one chef to view data.",
                    )
                )
            return Response(
                {"message": "Chef profile not found. Please complete your chef setup."},
                status=status.HTTP_404_NOT_FOUND,
            )

        chef_username = str(chef.chef_username or "").strip()
        is_self = chef_username.lower() == str(user.username).strip().lower()
        if profile.role == "admin" and not is_self and not requested_chef:
            fallback_used = True

        start_date = range_info["start_date"]
        end_date = range_info["end_date"]
        date_axis = [start_date + timedelta(days=idx) for idx in range(range_info["day_span"])]
        date_labels = [day.isoformat() for day in date_axis]

        now = timezone.now()
        campaigns_in_range_qs = Campaign.objects.filter(
            chef__iexact=chef_username,
            start_time__date__gte=start_date,
            start_time__date__lte=end_date,
        )
        campaigns_in_range = campaigns_in_range_qs.count()
        active_campaigns = Campaign.objects.filter(
            chef__iexact=chef_username,
            status="running",
            start_time__lte=now,
        ).filter(Q(end_time__isnull=True) | Q(end_time__gte=now))
        active_campaigns_count = active_campaigns.count()

        campaigns_daily_qs = (
            campaigns_in_range_qs.annotate(day=TruncDate("start_time"))
            .values("day")
            .annotate(total=Count("uid"))
            .order_by("day")
        )
        campaigns_by_day = {row["day"]: row["total"] for row in campaigns_daily_qs if row["day"]}
        campaigns_per_day = [int(campaigns_by_day.get(day, 0)) for day in date_axis]

        chef_foods_qs = Food.objects.filter(chef__iexact=chef_username)
        chef_food_ids = {str(food.uid) for food in chef_foods_qs}
        chef_food_names = {str(food.uid): food.food_name for food in chef_foods_qs}

        orders_in_range = 0
        revenue_in_range = 0.0
        revenue_by_day = {day: 0.0 for day in date_axis}
        orders_by_day = {day: 0 for day in date_axis}
        food_quantity_map = {str(food_id): 0 for food_id in chef_food_ids}

        orders_rows = Order.objects.filter(
            order_time__date__gte=start_date,
            order_time__date__lte=end_date,
        ).values("order_time", "food_items", "food_price", "quantity")

        for row in orders_rows:
            all_food_ids = _parse_food_ids(row.get("food_items"))
            if not all_food_ids:
                continue

            matched_food_ids = [food_id for food_id in all_food_ids if food_id in chef_food_ids]
            if not matched_food_ids:
                continue

            orders_in_range += 1
            total_items_in_order = max(len(all_food_ids), 1)
            matched_items = len(matched_food_ids)
            ratio = matched_items / total_items_in_order
            proportional_revenue = self._to_float(row.get("food_price")) * ratio
            revenue_in_range += proportional_revenue

            day = row["order_time"].date() if row.get("order_time") else None
            if day and day in revenue_by_day:
                revenue_by_day[day] += proportional_revenue
                orders_by_day[day] += 1

            quantity = int(row.get("quantity") or 0)
            quantity = quantity if quantity > 0 else matched_items
            distributed_quantity = max(1, int(round(quantity / max(matched_items, 1))))
            for food_id in matched_food_ids:
                food_quantity_map[food_id] = food_quantity_map.get(food_id, 0) + distributed_quantity

        revenue_in_range = round(revenue_in_range, 2)
        avg_order_value = round(revenue_in_range / orders_in_range, 2) if orders_in_range else 0.0
        revenue_per_day = [round(revenue_by_day.get(day, 0.0), 2) for day in date_axis]
        orders_per_day = [int(orders_by_day.get(day, 0)) for day in date_axis]

        top_campaigns = [
            {
                "campaign_id": str(campaign.uid),
                "title": campaign.title,
                "status": campaign.status,
                "total_orders": int(campaign.total_orders or 0),
                "quantity_available": int(campaign.quantity_available or 0),
            }
            for campaign in campaigns_in_range_qs.order_by("-total_orders", "-start_time")[:5]
        ]

        top_foods = [
            {
                "food_id": food_id,
                "name": chef_food_names.get(food_id, "Unknown Food"),
                "quantity_sold": quantity,
            }
            for food_id, quantity in sorted(food_quantity_map.items(), key=lambda item: item[1], reverse=True)[:5]
        ]

        year = end_date.year
        year_start = date(year, 1, 1)
        year_end = date(year, 12, 31)
        monthly_revenue_map = {month: 0.0 for month in range(1, 13)}

        yearly_orders = Order.objects.filter(
            order_time__date__gte=year_start,
            order_time__date__lte=year_end,
        ).values("order_time", "food_items", "food_price")

        for row in yearly_orders:
            all_food_ids = _parse_food_ids(row.get("food_items"))
            if not all_food_ids:
                continue
            matched = [food_id for food_id in all_food_ids if food_id in chef_food_ids]
            if not matched:
                continue
            ratio = len(matched) / max(len(all_food_ids), 1)
            revenue_piece = self._to_float(row.get("food_price")) * ratio
            order_time = row.get("order_time")
            if order_time:
                monthly_revenue_map[order_time.month] += revenue_piece

        monthly_labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        monthly_revenue = [round(monthly_revenue_map[idx], 2) for idx in range(1, 13)]

        summary = {
            "balance": round(self._to_float(chef.balance), 2),
            "campaign_points": int(chef.campaign_points or 0),
            "subscription_status": chef.subscription_status,
            "active_campaigns": active_campaigns_count,
            "campaigns_in_range": campaigns_in_range,
            "orders_in_range": orders_in_range,
            "revenue_in_range": revenue_in_range,
            "avg_order_value": avg_order_value,
            "lifetime_total_orders": int(chef.total_orders_received or 0),
            "lifetime_total_campaigns": int(chef.total_campaigns or 0),
        }

        metrics_legacy = {
            "balance": summary["balance"],
            "total_orders_received": summary["lifetime_total_orders"],
            "total_campaigns": summary["lifetime_total_campaigns"],
            "campaign_points": summary["campaign_points"],
        }

        payload = {
            "range": {
                "key": range_info["key"],
                "label": range_info["label"],
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
            },
            "chef": {
                "username": chef_username,
                "requested_by_role": profile.role,
                "is_self": is_self,
                "fallback_used": fallback_used,
            },
            "summary": summary,
            "trends": {
                "labels": date_labels,
                "campaigns_per_day": campaigns_per_day,
                "orders_per_day": orders_per_day,
                "revenue_per_day": revenue_per_day,
            },
            "yearly_revenue": {
                "year": year,
                "labels": monthly_labels,
                "revenue_per_month": monthly_revenue,
            },
            "top_performers": {
                "campaigns": top_campaigns,
                "foods": top_foods,
            },
            "metrices": metrics_legacy,
            "status": status.HTTP_200_OK,
        }
        if fallback_used:
            payload["warning"] = (
                f"Showing dashboard for chef '{chef_username}'. "
                "Use ?chef=<chef_username> to view a specific chef."
            )

        return Response(payload)
