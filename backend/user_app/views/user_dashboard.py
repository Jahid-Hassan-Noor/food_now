from datetime import datetime, timedelta
import json

from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from admin_app.models import Profile
from user_app.models import Food, Order, Order_history


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


def _to_float(value):
    return float(value or 0.0)


def _to_int(value):
    try:
        return int(value or 0)
    except Exception:
        return 0


def _normalize_rows(user):
    normalized = []

    order_rows = Order.objects.filter(user=user.username).values(
        "uid",
        "order_time",
        "food_items",
        "food_price",
        "quantity",
    )
    for row in order_rows:
        order_id = str(row.get("uid") or "").strip()
        if not order_id:
            continue
        normalized.append(
            {
                "order_id": order_id,
                "order_time": row.get("order_time"),
                "food_items": row.get("food_items"),
                "food_price": _to_float(row.get("food_price")),
                "quantity": _to_int(row.get("quantity")),
            }
        )

    history_rows = Order_history.objects.filter(user=user.username).values(
        "uid",
        "order_id",
        "order_time",
        "food_items",
        "food_price",
        "quantity",
    )
    for row in history_rows:
        order_id = str(row.get("order_id") or row.get("uid") or "").strip()
        if not order_id:
            continue
        normalized.append(
            {
                "order_id": order_id,
                "order_time": row.get("order_time"),
                "food_items": row.get("food_items"),
                "food_price": _to_float(row.get("food_price")),
                "quantity": _to_int(row.get("quantity")),
            }
        )

    # Deduplicate by order_id while preferring the latest timestamp when duplicated.
    deduped = {}
    for row in normalized:
        order_id = row["order_id"]
        existing = deduped.get(order_id)
        if not existing:
            deduped[order_id] = row
            continue

        existing_time = existing.get("order_time")
        current_time = row.get("order_time")
        if current_time and (not existing_time or current_time > existing_time):
            deduped[order_id] = row

    return sorted(
        deduped.values(),
        key=lambda row: row.get("order_time") or timezone.now(),
        reverse=True,
    )


class UserDashboard(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        profile = Profile.objects.filter(user=user).first()
        if not profile:
            return Response({"message": "Profile not found"}, status=status.HTTP_404_NOT_FOUND)

        if profile.role not in ["user", "chef", "admin"]:
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

        start_date = range_info["start_date"]
        end_date = range_info["end_date"]
        date_axis = [start_date + timedelta(days=idx) for idx in range(range_info["day_span"])]
        date_labels = [day.isoformat() for day in date_axis]

        all_rows = _normalize_rows(user)

        rows_in_range = []
        today = timezone.localdate()
        orders_today = 0
        lifetime_spend = 0.0
        all_food_ids = set()

        for row in all_rows:
            order_time = row.get("order_time")
            if not order_time:
                continue

            order_day = order_time.date()
            food_ids = _parse_food_ids(row.get("food_items"))
            all_food_ids.update(food_ids)
            lifetime_spend += _to_float(row.get("food_price"))

            if order_day == today:
                orders_today += 1

            if start_date <= order_day <= end_date:
                rows_in_range.append({**row, "food_ids": food_ids, "order_day": order_day})

        food_name_map = {str(food.uid): food.food_name for food in Food.objects.filter(uid__in=list(all_food_ids))}

        spend_in_range = 0.0
        items_in_range = 0
        orders_per_day_map = {day: 0 for day in date_axis}
        spend_per_day_map = {day: 0.0 for day in date_axis}
        items_per_day_map = {day: 0 for day in date_axis}
        food_quantity_map = {}
        food_order_count_map = {}

        for row in rows_in_range:
            order_day = row["order_day"]
            amount = _to_float(row.get("food_price"))
            food_ids = row.get("food_ids") or []
            quantity = _to_int(row.get("quantity"))
            if quantity <= 0:
                quantity = max(len(food_ids), 1)

            spend_in_range += amount
            items_in_range += quantity
            orders_per_day_map[order_day] = orders_per_day_map.get(order_day, 0) + 1
            spend_per_day_map[order_day] = spend_per_day_map.get(order_day, 0.0) + amount
            items_per_day_map[order_day] = items_per_day_map.get(order_day, 0) + quantity

            unique_food_ids = list(dict.fromkeys(food_ids))
            distributed_quantity = max(1, int(round(quantity / max(len(unique_food_ids), 1))))
            for food_id in unique_food_ids:
                food_quantity_map[food_id] = food_quantity_map.get(food_id, 0) + distributed_quantity
                food_order_count_map[food_id] = food_order_count_map.get(food_id, 0) + 1

        orders_in_range = len(rows_in_range)
        spend_in_range = round(spend_in_range, 2)
        avg_order_value = round(spend_in_range / orders_in_range, 2) if orders_in_range else 0.0
        active_days = sum(1 for day in date_axis if orders_per_day_map.get(day, 0) > 0)

        orders_per_day = [int(orders_per_day_map.get(day, 0)) for day in date_axis]
        spend_per_day = [round(spend_per_day_map.get(day, 0.0), 2) for day in date_axis]
        items_per_day = [int(items_per_day_map.get(day, 0)) for day in date_axis]

        year = end_date.year
        monthly_spend_map = {month: 0.0 for month in range(1, 13)}
        for row in all_rows:
            order_time = row.get("order_time")
            if not order_time or order_time.year != year:
                continue
            monthly_spend_map[order_time.month] += _to_float(row.get("food_price"))

        month_labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        monthly_spend = [round(monthly_spend_map[idx], 2) for idx in range(1, 13)]

        top_foods = [
            {
                "food_id": food_id,
                "name": food_name_map.get(food_id, "Unknown Food"),
                "quantity_ordered": int(quantity),
                "times_ordered": int(food_order_count_map.get(food_id, 0)),
            }
            for food_id, quantity in sorted(food_quantity_map.items(), key=lambda item: item[1], reverse=True)[:6]
        ]

        recent_orders = []
        for row in all_rows[:8]:
            food_ids = _parse_food_ids(row.get("food_items"))
            foods = [food_name_map.get(food_id, "Unknown Food") for food_id in food_ids[:3]]
            order_time = row.get("order_time")
            recent_orders.append(
                {
                    "order_id": row.get("order_id"),
                    "order_time": order_time.isoformat() if order_time else None,
                    "total_amount": round(_to_float(row.get("food_price")), 2),
                    "quantity": _to_int(row.get("quantity")) if _to_int(row.get("quantity")) > 0 else max(len(food_ids), 1),
                    "food_count": len(food_ids),
                    "foods": foods,
                }
            )

        last_order_at = all_rows[0].get("order_time") if all_rows else None

        return Response(
            {
                "range": {
                    "key": range_info["key"],
                    "label": range_info["label"],
                    "start_date": start_date.isoformat(),
                    "end_date": end_date.isoformat(),
                },
                "user": {
                    "username": user.username,
                    "email": user.email,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "role": profile.role,
                },
                "summary": {
                    "orders_in_range": orders_in_range,
                    "orders_today": orders_today,
                    "spend_in_range": spend_in_range,
                    "avg_order_value": avg_order_value,
                    "items_in_range": int(items_in_range),
                    "active_days": int(active_days),
                    "lifetime_orders": len(all_rows),
                    "lifetime_spend": round(lifetime_spend, 2),
                    "profile_total_orders": int(profile.total_orders or 0),
                    "last_order_at": last_order_at.isoformat() if last_order_at else None,
                },
                "trends": {
                    "labels": date_labels,
                    "orders_per_day": orders_per_day,
                    "spend_per_day": spend_per_day,
                    "items_per_day": items_per_day,
                },
                "yearly_spend": {
                    "year": year,
                    "labels": month_labels,
                    "spend_per_month": monthly_spend,
                },
                "top_foods": top_foods,
                "recent_orders": recent_orders,
                "status": status.HTTP_200_OK,
            }
        )


# Backward-compatible alias used by existing URL config.
user_dashboad = UserDashboard
