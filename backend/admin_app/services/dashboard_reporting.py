from __future__ import annotations

import csv
import io
import json
import textwrap
from datetime import date, datetime, timedelta

from django.contrib.auth.models import User
from django.db.models import Count, Sum
from django.db.models.functions import ExtractMonth, TruncDate
from django.utils import timezone

from admin_app.models import Pending_transaction, Profile, Transaction_history
from user_app.models import Campaign, Chef, Food, Order


RANGE_LABELS = {
    "today": "Today",
    "7d": "Last 7 Days",
    "30d": "Last 30 Days",
    "month": "This Month",
    "custom": "Custom Range",
}


def _to_float(value):
    return float(value or 0.0)


def _safe_date_parse(value):
    if not value:
        return None
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except (TypeError, ValueError):
        return None


def resolve_range(range_key=None, start_date_raw=None, end_date_raw=None):
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


def build_dashboard_payload(range_info):
    start_date = range_info["start_date"]
    end_date = range_info["end_date"]
    date_axis = [start_date + timedelta(days=idx) for idx in range(range_info["day_span"])]
    date_labels = [day.isoformat() for day in date_axis]

    total_users = Profile.objects.filter(role="user").count() or User.objects.count()
    total_chefs = Chef.objects.count()

    campaigns_count = Campaign.objects.filter(
        start_time__date__gte=start_date,
        start_time__date__lte=end_date,
    ).count()
    orders_count = Order.objects.filter(order_time__date__gte=start_date, order_time__date__lte=end_date).count()

    pending_recharge_total = _to_float(
        Pending_transaction.objects.filter(
            transaction_time__date__gte=start_date,
            transaction_time__date__lte=end_date,
        ).aggregate(total=Sum("amount"))["total"]
    )
    completed_recharge_total = _to_float(
        Transaction_history.objects.filter(
            transaction_time__date__gte=start_date,
            transaction_time__date__lte=end_date,
        ).aggregate(total=Sum("amount"))["total"]
    )
    recharge_total = round(pending_recharge_total + completed_recharge_total, 2)

    campaigns_daily_qs = (
        Campaign.objects.filter(start_time__date__gte=start_date, start_time__date__lte=end_date)
        .annotate(day=TruncDate("start_time"))
        .values("day")
        .annotate(total=Count("uid"))
        .order_by("day")
    )
    campaigns_by_day = {row["day"]: row["total"] for row in campaigns_daily_qs if row["day"]}

    orders_daily_qs = (
        Order.objects.filter(order_time__date__gte=start_date, order_time__date__lte=end_date)
        .annotate(day=TruncDate("order_time"))
        .values("day")
        .annotate(total=Count("uid"))
        .order_by("day")
    )
    orders_by_day = {row["day"]: row["total"] for row in orders_daily_qs if row["day"]}

    recharge_by_day = {day: 0.0 for day in date_axis}

    pending_recharge_daily_qs = (
        Pending_transaction.objects.filter(
            transaction_time__date__gte=start_date,
            transaction_time__date__lte=end_date,
        )
        .annotate(day=TruncDate("transaction_time"))
        .values("day")
        .annotate(total=Sum("amount"))
        .order_by("day")
    )
    completed_recharge_daily_qs = (
        Transaction_history.objects.filter(
            transaction_time__date__gte=start_date,
            transaction_time__date__lte=end_date,
        )
        .annotate(day=TruncDate("transaction_time"))
        .values("day")
        .annotate(total=Sum("amount"))
        .order_by("day")
    )
    for row in pending_recharge_daily_qs:
        if row["day"]:
            recharge_by_day[row["day"]] += _to_float(row["total"])
    for row in completed_recharge_daily_qs:
        if row["day"]:
            recharge_by_day[row["day"]] += _to_float(row["total"])

    campaigns_series = [int(campaigns_by_day.get(day, 0)) for day in date_axis]
    recharge_series = [round(recharge_by_day.get(day, 0.0), 2) for day in date_axis]
    orders_series = [int(orders_by_day.get(day, 0)) for day in date_axis]

    top_chef_map = {}
    pending_recharge_by_chef = (
        Pending_transaction.objects.filter(
            transaction_time__date__gte=start_date,
            transaction_time__date__lte=end_date,
        )
        .values("chef")
        .annotate(total=Sum("amount"))
    )
    completed_recharge_by_chef = (
        Transaction_history.objects.filter(
            transaction_time__date__gte=start_date,
            transaction_time__date__lte=end_date,
        )
        .values("chef")
        .annotate(total=Sum("amount"))
    )

    for row in pending_recharge_by_chef:
        chef_name = (row.get("chef") or "").strip()
        if chef_name:
            top_chef_map[chef_name] = top_chef_map.get(chef_name, 0.0) + _to_float(row.get("total"))
    for row in completed_recharge_by_chef:
        chef_name = (row.get("chef") or "").strip()
        if chef_name:
            top_chef_map[chef_name] = top_chef_map.get(chef_name, 0.0) + _to_float(row.get("total"))

    top_chefs = [
        {"chef": chef_name, "revenue": round(revenue, 2)}
        for chef_name, revenue in sorted(top_chef_map.items(), key=lambda item: item[1], reverse=True)[:5]
    ]

    top_campaigns_qs = Campaign.objects.filter(
        start_time__date__gte=start_date,
        start_time__date__lte=end_date,
    ).order_by("-total_orders", "-start_time")[:5]
    if not top_campaigns_qs:
        top_campaigns_qs = Campaign.objects.order_by("-total_orders", "-start_time")[:5]

    top_campaigns = [
        {
            "campaign_id": str(campaign.uid),
            "title": campaign.title,
            "chef": campaign.chef,
            "total_orders": int(campaign.total_orders or 0),
        }
        for campaign in top_campaigns_qs
    ]

    food_totals = {}
    order_rows = Order.objects.filter(order_time__date__gte=start_date, order_time__date__lte=end_date).values(
        "food_items", "quantity"
    )
    for row in order_rows:
        quantity = int(row.get("quantity") or 0)
        quantity = quantity if quantity > 0 else 1
        for food_id in _parse_food_ids(row.get("food_items")):
            food_totals[food_id] = food_totals.get(food_id, 0) + quantity

    top_food_entries = sorted(food_totals.items(), key=lambda item: item[1], reverse=True)[:5]
    top_food_ids = [entry[0] for entry in top_food_entries]
    food_name_map = {str(food.uid): food.food_name for food in Food.objects.filter(uid__in=top_food_ids)}
    top_foods = [
        {
            "food_id": food_id,
            "name": food_name_map.get(str(food_id), "Unknown Food"),
            "quantity_sold": quantity_sold,
        }
        for food_id, quantity_sold in top_food_entries
    ]

    revenue_year = end_date.year
    year_start = date(revenue_year, 1, 1)
    year_end = date(revenue_year, 12, 31)

    revenue_month_map = {month: 0.0 for month in range(1, 13)}

    pending_revenue_by_month = (
        Pending_transaction.objects.filter(
            transaction_time__date__gte=year_start,
            transaction_time__date__lte=year_end,
        )
        .annotate(month=ExtractMonth("transaction_time"))
        .values("month")
        .annotate(total=Sum("amount"))
    )
    completed_revenue_by_month = (
        Transaction_history.objects.filter(
            transaction_time__date__gte=year_start,
            transaction_time__date__lte=year_end,
        )
        .annotate(month=ExtractMonth("transaction_time"))
        .values("month")
        .annotate(total=Sum("amount"))
    )
    for row in pending_revenue_by_month:
        month = row.get("month")
        if month:
            revenue_month_map[month] += _to_float(row.get("total"))
    for row in completed_revenue_by_month:
        month = row.get("month")
        if month:
            revenue_month_map[month] += _to_float(row.get("total"))

    revenue_labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    revenue_per_month = [round(revenue_month_map[month], 2) for month in range(1, 13)]

    return {
        "range": {
            "key": range_info["key"],
            "label": range_info["label"],
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
        },
        "summary": {
            "total_users": total_users,
            "total_chefs": total_chefs,
            "campaigns_in_range": campaigns_count,
            "recharge_in_range": recharge_total,
            "orders_in_range": orders_count,
            # Backward-compatible summary keys
            "campaigns_this_month": campaigns_count,
            "recharge_this_month": recharge_total,
            "orders_today": orders_count,
        },
        "last_30_days": {
            "labels": date_labels,
            "campaigns_per_day": campaigns_series,
            "recharge_per_day": recharge_series,
            "orders_per_day": orders_series,
        },
        "yearly_revenue": {
            "year": revenue_year,
            "labels": revenue_labels,
            "revenue_per_month": revenue_per_month,
        },
        "top_performers": {
            "chefs_by_revenue": top_chefs,
            "campaigns_by_orders": top_campaigns,
            "foods_by_quantity": top_foods,
        },
    }


def build_dashboard_csv(payload):
    output = io.StringIO()
    writer = csv.writer(output)

    range_info = payload.get("range", {})
    summary = payload.get("summary", {})
    daily = payload.get("last_30_days", {})
    yearly = payload.get("yearly_revenue", {})
    top = payload.get("top_performers", {})

    writer.writerow(["Admin Dashboard Report"])
    writer.writerow(["Range Label", range_info.get("label", "")])
    writer.writerow(["Start Date", range_info.get("start_date", "")])
    writer.writerow(["End Date", range_info.get("end_date", "")])
    writer.writerow([])

    writer.writerow(["Summary"])
    writer.writerow(["Metric", "Value"])
    writer.writerow(["Total Users", summary.get("total_users", 0)])
    writer.writerow(["Total Chefs", summary.get("total_chefs", 0)])
    writer.writerow(["Campaigns (Range)", summary.get("campaigns_in_range", 0)])
    writer.writerow(["Recharge/Revenue (Range)", summary.get("recharge_in_range", 0)])
    writer.writerow(["Orders (Range)", summary.get("orders_in_range", 0)])
    writer.writerow([])

    writer.writerow(["Daily Trends"])
    writer.writerow(["Date", "Campaigns", "Recharge", "Orders"])
    labels = daily.get("labels", [])
    campaigns = daily.get("campaigns_per_day", [])
    recharge = daily.get("recharge_per_day", [])
    orders = daily.get("orders_per_day", [])
    for idx, label in enumerate(labels):
        writer.writerow(
            [
                label,
                campaigns[idx] if idx < len(campaigns) else 0,
                recharge[idx] if idx < len(recharge) else 0,
                orders[idx] if idx < len(orders) else 0,
            ]
        )
    writer.writerow([])

    writer.writerow([f"Monthly Revenue ({yearly.get('year', '')})"])
    writer.writerow(["Month", "Revenue"])
    month_labels = yearly.get("labels", [])
    month_values = yearly.get("revenue_per_month", [])
    for idx, month in enumerate(month_labels):
        writer.writerow([month, month_values[idx] if idx < len(month_values) else 0])
    writer.writerow([])

    writer.writerow(["Top Chefs By Revenue"])
    writer.writerow(["Chef", "Revenue"])
    for item in top.get("chefs_by_revenue", []):
        writer.writerow([item.get("chef", ""), item.get("revenue", 0)])
    writer.writerow([])

    writer.writerow(["Top Campaigns By Orders"])
    writer.writerow(["Campaign", "Chef", "Orders"])
    for item in top.get("campaigns_by_orders", []):
        writer.writerow([item.get("title", ""), item.get("chef", ""), item.get("total_orders", 0)])
    writer.writerow([])

    writer.writerow(["Top Foods By Quantity Sold"])
    writer.writerow(["Food", "Quantity Sold"])
    for item in top.get("foods_by_quantity", []):
        writer.writerow([item.get("name", ""), item.get("quantity_sold", 0)])

    return output.getvalue()


def _pdf_escape(text):
    escaped = str(text).replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")
    return escaped.encode("latin-1", "replace").decode("latin-1")


def _paginate_lines(lines, lines_per_page=48):
    pages = []
    for idx in range(0, len(lines), lines_per_page):
        pages.append(lines[idx : idx + lines_per_page])
    return pages or [["Admin dashboard report has no data."]]


def _downsample(values, max_points=30):
    cleaned = [float(value or 0) for value in values]
    if len(cleaned) <= max_points:
        return cleaned

    chunk_size = len(cleaned) / max_points
    sampled = []
    for idx in range(max_points):
        start = int(round(idx * chunk_size))
        end = int(round((idx + 1) * chunk_size))
        segment = cleaned[start:end] or [0.0]
        sampled.append(sum(segment) / len(segment))
    return sampled


def _downsample_with_labels(values, labels, max_points=30):
    cleaned_values = [float(value or 0) for value in values]
    cleaned_labels = [str(label) for label in labels]

    if len(cleaned_values) <= max_points:
        return cleaned_values, cleaned_labels[: len(cleaned_values)]

    chunk_size = len(cleaned_values) / max_points
    sampled_values = []
    sampled_labels = []
    for idx in range(max_points):
        start = int(round(idx * chunk_size))
        end = int(round((idx + 1) * chunk_size))
        end = max(end, start + 1)
        segment = cleaned_values[start:end] or [0.0]
        sampled_values.append(sum(segment) / len(segment))
        label_index = min(end - 1, len(cleaned_labels) - 1)
        sampled_labels.append(cleaned_labels[label_index] if label_index >= 0 else "")
    return sampled_values, sampled_labels


def _tick_indices(count, max_ticks):
    if count <= 0:
        return []
    if count <= max_ticks:
        return list(range(count))
    steps = max_ticks - 1
    last = count - 1
    idx_set = set()
    for idx in range(max_ticks):
        idx_set.add(int(round((idx * last) / steps)))
    return sorted(idx_set)


def _format_axis_value(value):
    amount = float(value or 0)
    absolute = abs(amount)
    if absolute >= 1_000_000:
        return f"{amount/1_000_000:.1f}M"
    if absolute >= 1_000:
        return f"{amount/1_000:.1f}K"
    if amount.is_integer():
        return str(int(amount))
    return f"{amount:.2f}"


def _short_x_label(label):
    text = str(label or "")
    if len(text) >= 10 and text[4] == "-" and text[7] == "-":
        return text[5:]
    return text[:8]


def _bar_chart_commands(*, x, y, width, height, title, values, color, x_labels=None, max_x_ticks=8):
    commands = []
    commands.append(f"BT /F1 10 Tf {x:.2f} {y + height + 12:.2f} Td ({_pdf_escape(title)}) Tj ET")

    # Chart frame
    commands.append("0.76 0.81 0.88 RG")
    commands.append("0.8 w")
    commands.append(f"{x:.2f} {y:.2f} {width:.2f} {height:.2f} re S")

    # Horizontal guides + Y labels
    commands.append("0.88 0.90 0.95 RG")
    for idx in range(1, 4):
        guide_y = y + (height * idx / 4)
        commands.append(f"{x:.2f} {guide_y:.2f} m {x + width:.2f} {guide_y:.2f} l S")

    max_value = max([float(v or 0) for v in values] + [1.0])
    count = max(len(values), 1)
    gap = max(1.8, width * 0.01)
    total_gap = gap * (count + 1)
    bar_width = max(1.0, (width - total_gap) / count)

    r, g, b = color
    commands.append(f"{r:.3f} {g:.3f} {b:.3f} rg")
    for idx, value in enumerate(values):
        bar_height = ((float(value or 0) / max_value) * (height - 8)) if max_value > 0 else 0
        bar_x = x + gap + idx * (bar_width + gap)
        bar_y = y + 2
        commands.append(f"{bar_x:.2f} {bar_y:.2f} {bar_width:.2f} {bar_height:.2f} re f")

    # Y-axis numbers
    commands.append("0.16 0.19 0.25 rg")
    for idx in range(0, 5):
        ratio = idx / 4
        y_value = max_value * ratio
        y_pos = y + (height * ratio) - 3
        label_x = x - 30
        commands.append(f"BT /F1 7 Tf {label_x:.2f} {y_pos:.2f} Td ({_pdf_escape(_format_axis_value(y_value))}) Tj ET")

    # X-axis labels
    labels = x_labels or [str(idx + 1) for idx in range(count)]
    if len(labels) < count:
        labels = labels + [str(idx + 1) for idx in range(len(labels), count)]
    tick_idx = _tick_indices(count, max_x_ticks)
    for idx in tick_idx:
        bar_x = x + gap + idx * (bar_width + gap)
        label_x = bar_x + (bar_width / 2) - 10
        label_y = y - 11
        commands.append(
            f"BT /F1 7 Tf {label_x:.2f} {label_y:.2f} Td ({_pdf_escape(_short_x_label(labels[idx]))}) Tj ET"
        )

    commands.append(
        f"BT /F1 8 Tf {x + width - 120:.2f} {y + height + 1:.2f} Td (Max: {_pdf_escape(round(max_value, 2))}) Tj ET"
    )
    return commands


def _build_pdf_document(page_lines, page_chart_commands=None):
    object_count = 3 + (2 * len(page_lines))
    objects = {}

    page_object_numbers = []
    for idx in range(len(page_lines)):
        page_object_numbers.append(4 + (idx * 2))

    kids = " ".join(f"{obj_num} 0 R" for obj_num in page_object_numbers)
    objects[1] = b"<< /Type /Catalog /Pages 2 0 R >>"
    objects[2] = f"<< /Type /Pages /Kids [{kids}] /Count {len(page_lines)} >>".encode("latin-1")
    objects[3] = b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"

    for idx, lines in enumerate(page_lines):
        page_obj_num = 4 + (idx * 2)
        content_obj_num = page_obj_num + 1

        commands = ["BT", "/F1 10 Tf", "50 760 Td", "14 TL"]
        for line_idx, line in enumerate(lines):
            commands.append(f"({_pdf_escape(line)}) Tj")
            if line_idx < len(lines) - 1:
                commands.append("T*")
        commands.append("ET")

        if page_chart_commands and idx < len(page_chart_commands):
            commands.extend(page_chart_commands[idx] or [])

        stream_data = "\n".join(commands).encode("latin-1")
        objects[content_obj_num] = (
            f"<< /Length {len(stream_data)} >>\nstream\n".encode("latin-1")
            + stream_data
            + b"\nendstream"
        )
        objects[page_obj_num] = (
            f"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] "
            f"/Resources << /Font << /F1 3 0 R >> >> /Contents {content_obj_num} 0 R >>"
        ).encode("latin-1")

    buffer = io.BytesIO()
    buffer.write(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")

    offsets = {}
    for obj_num in range(1, object_count + 1):
        offsets[obj_num] = buffer.tell()
        buffer.write(f"{obj_num} 0 obj\n".encode("latin-1"))
        buffer.write(objects[obj_num])
        buffer.write(b"\nendobj\n")

    xref_pos = buffer.tell()
    buffer.write(f"xref\n0 {object_count + 1}\n".encode("latin-1"))
    buffer.write(b"0000000000 65535 f \n")
    for obj_num in range(1, object_count + 1):
        buffer.write(f"{offsets[obj_num]:010d} 00000 n \n".encode("latin-1"))
    buffer.write(
        f"trailer\n<< /Size {object_count + 1} /Root 1 0 R >>\nstartxref\n{xref_pos}\n%%EOF".encode("latin-1")
    )
    return buffer.getvalue()


def build_dashboard_pdf(payload):
    range_info = payload.get("range", {})
    summary = payload.get("summary", {})
    daily = payload.get("last_30_days", {})
    yearly = payload.get("yearly_revenue", {})
    top = payload.get("top_performers", {})

    lines = [
        "Food Now - Admin Dashboard Report",
        f"Range: {range_info.get('label', '')} ({range_info.get('start_date', '')} to {range_info.get('end_date', '')})",
        "",
        "Summary",
        f"Total Users: {summary.get('total_users', 0)}",
        f"Total Chefs: {summary.get('total_chefs', 0)}",
        f"Campaigns (Range): {summary.get('campaigns_in_range', 0)}",
        f"Recharge/Revenue (Range): {summary.get('recharge_in_range', 0)}",
        f"Orders (Range): {summary.get('orders_in_range', 0)}",
        "",
        "Daily Trends",
    ]

    labels = daily.get("labels", [])
    campaigns = daily.get("campaigns_per_day", [])
    recharge = daily.get("recharge_per_day", [])
    orders = daily.get("orders_per_day", [])
    for idx, label in enumerate(labels):
        lines.append(
            f"{label} | campaigns: {campaigns[idx] if idx < len(campaigns) else 0}"
            f" | recharge: {recharge[idx] if idx < len(recharge) else 0}"
            f" | orders: {orders[idx] if idx < len(orders) else 0}"
        )

    lines.extend(
        [
            "",
            f"Monthly Revenue ({yearly.get('year', '')})",
        ]
    )
    month_labels = yearly.get("labels", [])
    month_values = yearly.get("revenue_per_month", [])
    for idx, month in enumerate(month_labels):
        lines.append(f"{month}: {month_values[idx] if idx < len(month_values) else 0}")

    lines.extend(["", "Top Chefs By Revenue"])
    for item in top.get("chefs_by_revenue", []):
        lines.append(f"{item.get('chef', '')}: {item.get('revenue', 0)}")

    lines.extend(["", "Top Campaigns By Orders"])
    for item in top.get("campaigns_by_orders", []):
        lines.append(
            f"{item.get('title', '')} | chef: {item.get('chef', '')} | orders: {item.get('total_orders', 0)}"
        )

    lines.extend(["", "Top Foods By Quantity Sold"])
    for item in top.get("foods_by_quantity", []):
        lines.append(f"{item.get('name', '')}: {item.get('quantity_sold', 0)}")

    wrapped_lines = []
    for line in lines:
        if not line:
            wrapped_lines.append("")
            continue
        wrapped_lines.extend(textwrap.wrap(line, width=95) or [""])

    pages = _paginate_lines(wrapped_lines, lines_per_page=46)
    chart_pages = [[] for _ in pages]

    monthly_values = [float(value or 0) for value in yearly.get("revenue_per_month", [])]
    month_labels = yearly.get("labels", [])

    orders_series, orders_labels = _downsample_with_labels(
        daily.get("orders_per_day", []),
        daily.get("labels", []),
        max_points=30,
    )
    campaigns_series, campaigns_labels = _downsample_with_labels(
        daily.get("campaigns_per_day", []),
        daily.get("labels", []),
        max_points=30,
    )

    visual_lines = ["Visual Summary Charts", ""]
    visual_commands = []
    visual_commands.extend(
        _bar_chart_commands(
            x=50,
            y=430,
            width=510,
            height=260,
            title=f"Monthly Revenue ({yearly.get('year', '')})",
            values=monthly_values or [0],
            color=(0.11, 0.66, 0.33),
            x_labels=month_labels,
            max_x_ticks=12,
        )
    )
    visual_commands.extend(
        _bar_chart_commands(
            x=50,
            y=120,
            width=245,
            height=220,
            title=f"Orders ({range_info.get('label', '')})",
            values=orders_series or [0],
            color=(0.15, 0.44, 0.88),
            x_labels=orders_labels,
            max_x_ticks=6,
        )
    )
    visual_commands.extend(
        _bar_chart_commands(
            x=315,
            y=120,
            width=245,
            height=220,
            title=f"Campaigns ({range_info.get('label', '')})",
            values=campaigns_series or [0],
            color=(0.90, 0.35, 0.11),
            x_labels=campaigns_labels,
            max_x_ticks=6,
        )
    )

    pages.append(visual_lines)
    chart_pages.append(visual_commands)

    return _build_pdf_document(pages, chart_pages)
