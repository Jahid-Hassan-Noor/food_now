from django.db.models import Q, Sum
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from admin_app.models import Pending_transaction, Profile, Subscription_option, Transaction_history
from admin_app.serializers import SubscriptionOptionSerializer
from user_app.models import Chef


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

    return request.user.username


def _proof_url(field_value):
    if not field_value:
        return None
    try:
        return field_value.url
    except Exception:
        value = str(field_value)
        return value or None


def _serialize_subscription_tx(item):
    return {
        "uid": str(item.uid),
        "status": item.status,
        "chef": item.chef,
        "type": item.type,
        "subscription_option_id": item.subscription_option_id,
        "subscription_option_name": item.subscription_option_name,
        "subscription_duration_months": item.subscription_duration_months,
        "transaction_description": item.transaction_description,
        "transaction_proof": _proof_url(item.transaction_proof),
        "transaction_time": item.transaction_time,
        "transaction_id": getattr(item, "transaction_id", None),
        "amount": float(item.amount or 0),
    }


class SubscriptionStatus(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile, profile_error = _require_profile(request)
        if profile_error:
            return profile_error

        chef_username = _resolve_chef_username(request, profile)
        chef = Chef.objects.filter(chef_username__iexact=chef_username).first()
        if not chef:
            return Response({"message": "Chef profile not found"}, status=status.HTTP_404_NOT_FOUND)

        pending_qs = Pending_transaction.objects.filter(
            chef__iexact=chef_username,
            type__iexact="subscription",
        ).order_by("-transaction_time")

        history_qs = Transaction_history.objects.filter(
            chef__iexact=chef_username,
            type__iexact="subscription",
        ).order_by("-transaction_time")

        approved_statuses = {"approved", "completed", "active"}
        approved_revenue = (
            history_qs.filter(status__in=approved_statuses).aggregate(total=Sum("amount")).get("total") or 0
        )

        available_options = Subscription_option.objects.all().order_by("duration_months", "price", "name")

        return Response(
            {
                "chef": chef.chef_username,
                "subscription_status": chef.subscription_status,
                "subscription_ends": chef.subscription_ends,
                "pending_request_count": pending_qs.count(),
                "latest_pending_request": (
                    _serialize_subscription_tx(pending_qs.first()) if pending_qs.exists() else None
                ),
                "history_count": history_qs.count(),
                "total_subscription_spent": float(approved_revenue),
                "latest_history": (
                    _serialize_subscription_tx(history_qs.first()) if history_qs.exists() else None
                ),
                "available_subscriptions": SubscriptionOptionSerializer(available_options, many=True).data,
                "status": status.HTTP_200_OK,
            }
        )


class SubscriptionOptions(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile, profile_error = _require_profile(request)
        if profile_error:
            return profile_error

        options = Subscription_option.objects.all().order_by("duration_months", "price", "name")
        return Response(
            {
                "count": options.count(),
                "available_subscriptions": SubscriptionOptionSerializer(options, many=True).data,
                "status": status.HTTP_200_OK,
            }
        )


class SubscriptionPending(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile, profile_error = _require_profile(request)
        if profile_error:
            return profile_error

        chef_username = _resolve_chef_username(request, profile)
        pending_qs = Pending_transaction.objects.filter(
            chef__iexact=chef_username,
            type__iexact="subscription",
        ).order_by("-transaction_time")

        items = [_serialize_subscription_tx(item) for item in pending_qs]
        total_amount = float(sum(item["amount"] for item in items))

        return Response(
            {
                "chef": chef_username,
                "summary": {
                    "total_pending": len(items),
                    "total_amount": total_amount,
                },
                "items": items,
                "status": status.HTTP_200_OK,
            }
        )


class SubscriptionHistory(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile, profile_error = _require_profile(request)
        if profile_error:
            return profile_error

        chef_username = _resolve_chef_username(request, profile)
        history_qs = Transaction_history.objects.filter(
            chef__iexact=chef_username,
            type__iexact="subscription",
        ).order_by("-transaction_time")

        status_filter = str(request.query_params.get("status", "")).strip().lower()
        if status_filter:
            history_qs = history_qs.filter(status__iexact=status_filter)

        search = str(request.query_params.get("search", "")).strip()
        if search:
            history_qs = history_qs.filter(
                Q(subscription_option_name__icontains=search)
                | Q(transaction_id__icontains=search)
                | Q(transaction_description__icontains=search)
            )

        items = [_serialize_subscription_tx(item) for item in history_qs]
        approved_statuses = {"approved", "completed", "active"}
        total_spent = float(
            history_qs.filter(status__in=approved_statuses).aggregate(total=Sum("amount")).get("total") or 0
        )

        return Response(
            {
                "chef": chef_username,
                "filters": {
                    "status": status_filter,
                    "search": search,
                },
                "summary": {
                    "total": len(items),
                    "approved": history_qs.filter(status__in=approved_statuses).count(),
                    "rejected": history_qs.filter(status__iexact="rejected").count(),
                    "total_spent": total_spent,
                },
                "items": items,
                "status": status.HTTP_200_OK,
            }
        )


class SubscriptionRequest(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        profile, profile_error = _require_profile(request)
        if profile_error:
            return profile_error

        chef_username = _resolve_chef_username(request, profile)
        chef = Chef.objects.filter(chef_username__iexact=chef_username).first()
        if not chef:
            return Response({"message": "Chef profile not found"}, status=status.HTTP_404_NOT_FOUND)

        option_id = request.data.get("subscription_option_id")
        try:
            option_id = int(option_id)
        except (TypeError, ValueError):
            return Response(
                {"message": "subscription_option_id must be a valid integer."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        option = Subscription_option.objects.filter(pk=option_id).first()
        if not option:
            return Response({"message": "Subscription option not found."}, status=status.HTTP_404_NOT_FOUND)

        existing_pending = Pending_transaction.objects.filter(
            chef__iexact=chef_username,
            type__iexact="subscription",
            status__in=["pending", "active"],
        )
        if existing_pending.exists():
            return Response(
                {"message": "A subscription request is already pending review."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        notes = str(request.data.get("transaction_description", "")).strip()
        description = f"Subscription request for {option.name} ({option.duration_months} month(s))."
        if notes:
            description = f"{description} Note: {notes}"

        proof = request.FILES.get("transaction_proof")
        if not proof:
            return Response(
                {"message": "Payment proof is mandatory."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        pending = Pending_transaction.objects.create(
            status="pending",
            chef=chef_username,
            type="subscription",
            subscription_option_id=option.id,
            subscription_option_name=option.name,
            subscription_duration_months=option.duration_months,
            transaction_description=description,
            transaction_proof=proof,
            amount=float(option.price),
        )

        return Response(
            {
                "message": "Subscription request submitted successfully.",
                "request": _serialize_subscription_tx(pending),
                "chef": chef_username,
                "subscription_status": chef.subscription_status,
                "subscription_ends": chef.subscription_ends,
                "status": status.HTTP_201_CREATED,
            },
            status=status.HTTP_201_CREATED,
        )
