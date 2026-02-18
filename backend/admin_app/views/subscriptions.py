from datetime import timedelta
from uuid import uuid4

from django.db.models import Q, Sum
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from admin_app.models import Pending_transaction, Profile, Subscription_option, Transaction_history
from admin_app.serializers import SubscriptionOptionSerializer
from user_app.models import Chef


DEFAULT_PROOF_PATH = "transaction_proofs/demo-proof.png"


def _require_admin(request):
    profile = Profile.objects.filter(user=request.user).first()
    if not profile:
        return None, Response({"message": "Profile not found"}, status=status.HTTP_404_NOT_FOUND)

    if not (request.user.is_superuser or profile.role == "admin"):
        return None, Response(
            {"message": "You are not authorized to access this page"},
            status=status.HTTP_403_FORBIDDEN,
        )

    return profile, None


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


def _safe_int(value, default):
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


class SubscriptionOptionListCreate(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        _profile, profile_error = _require_admin(request)
        if profile_error:
            return profile_error

        queryset = Subscription_option.objects.all().order_by("duration_months", "price", "name")
        return Response(
            {
                "count": queryset.count(),
                "subscriptions": SubscriptionOptionSerializer(queryset, many=True).data,
                "status": status.HTTP_200_OK,
            }
        )

    def post(self, request):
        _profile, profile_error = _require_admin(request)
        if profile_error:
            return profile_error

        serializer = SubscriptionOptionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            {
                "message": "Subscription option created successfully.",
                "subscription": serializer.data,
                "status": status.HTTP_201_CREATED,
            },
            status=status.HTTP_201_CREATED,
        )


class SubscriptionOptionDetail(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        _profile, profile_error = _require_admin(request)
        if profile_error:
            return profile_error

        option = Subscription_option.objects.filter(pk=pk).first()
        if not option:
            return Response({"message": "Subscription option not found."}, status=status.HTTP_404_NOT_FOUND)

        return Response(
            {
                "subscription": SubscriptionOptionSerializer(option).data,
                "status": status.HTTP_200_OK,
            }
        )

    def patch(self, request, pk):
        _profile, profile_error = _require_admin(request)
        if profile_error:
            return profile_error

        option = Subscription_option.objects.filter(pk=pk).first()
        if not option:
            return Response({"message": "Subscription option not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = SubscriptionOptionSerializer(option, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(
            {
                "message": "Subscription option updated successfully.",
                "subscription": serializer.data,
                "status": status.HTTP_200_OK,
            }
        )

    def delete(self, request, pk):
        _profile, profile_error = _require_admin(request)
        if profile_error:
            return profile_error

        option = Subscription_option.objects.filter(pk=pk).first()
        if not option:
            return Response({"message": "Subscription option not found."}, status=status.HTTP_404_NOT_FOUND)

        option.delete()
        return Response(
            {
                "message": "Subscription option deleted successfully.",
                "status": status.HTTP_200_OK,
            }
        )

    def put(self, request, pk):
        return self.patch(request, pk)


class AvailableSubscriptions(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        options = Subscription_option.objects.all().order_by("duration_months", "price", "name")
        serializer = SubscriptionOptionSerializer(options, many=True)
        return Response(
            {
                "available_subscriptions": serializer.data,
                "count": options.count(),
                "status": status.HTTP_200_OK,
            }
        )


class AdminSubscriptionPending(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        _profile, profile_error = _require_admin(request)
        if profile_error:
            return profile_error

        queryset = Pending_transaction.objects.filter(type__iexact="subscription").order_by("-transaction_time")

        status_filter = str(request.query_params.get("status", "pending")).strip().lower()
        if status_filter:
            queryset = queryset.filter(status__iexact=status_filter)

        chef_filter = str(request.query_params.get("chef", "")).strip()
        if chef_filter:
            queryset = queryset.filter(chef__icontains=chef_filter)

        search = str(request.query_params.get("search", "")).strip()
        if search:
            queryset = queryset.filter(
                Q(chef__icontains=search)
                | Q(subscription_option_name__icontains=search)
                | Q(transaction_description__icontains=search)
            )

        limit = max(1, min(_safe_int(request.query_params.get("limit"), 300), 1000))
        items = list(queryset[:limit])

        summary_qs = queryset
        total_amount = float(summary_qs.aggregate(total=Sum("amount")).get("total") or 0)

        return Response(
            {
                "filters": {
                    "status": status_filter,
                    "chef": chef_filter,
                    "search": search,
                    "limit": limit,
                },
                "summary": {
                    "total_pending": summary_qs.count(),
                    "total_amount": total_amount,
                    "unique_chefs": summary_qs.values("chef").distinct().count(),
                },
                "items": [_serialize_subscription_tx(item) for item in items],
                "status": status.HTTP_200_OK,
            }
        )


class AdminSubscriptionPendingDetail(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pending_id):
        _profile, profile_error = _require_admin(request)
        if profile_error:
            return profile_error

        pending = Pending_transaction.objects.filter(pk=pending_id, type__iexact="subscription").first()
        if not pending:
            return Response({"message": "Pending subscription request not found."}, status=status.HTTP_404_NOT_FOUND)

        action = str(request.data.get("action", "")).strip().lower()
        if action not in {"approve", "reject"}:
            return Response(
                {"message": "Invalid action. Use approve or reject."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        admin_note = str(request.data.get("admin_note", "")).strip()
        base_description = pending.transaction_description or ""
        if admin_note:
            base_description = f"{base_description} Admin note: {admin_note}".strip()

        history_status = "approved" if action == "approve" else "rejected"
        history = Transaction_history.objects.create(
            status=history_status,
            chef=pending.chef,
            type="subscription",
            subscription_option_id=pending.subscription_option_id,
            subscription_option_name=pending.subscription_option_name,
            subscription_duration_months=pending.subscription_duration_months,
            transaction_description=base_description,
            transaction_proof=(pending.transaction_proof or DEFAULT_PROOF_PATH),
            transaction_id=f"SUB-{timezone.now():%Y%m%d%H%M%S}-{uuid4().hex[:8].upper()}",
            amount=float(pending.amount or 0),
        )

        chef = Chef.objects.filter(chef_username__iexact=pending.chef).first()
        if action == "approve" and chef:
            now = timezone.now()
            months = int(pending.subscription_duration_months or 1)
            baseline = now
            current_status = str(chef.subscription_status or "").strip().lower()
            if current_status == "active" and chef.subscription_ends and chef.subscription_ends > now:
                baseline = chef.subscription_ends
            chef.subscription_status = "Active"
            chef.subscription_ends = baseline + timedelta(days=max(months, 1) * 30)
            chef.save(update_fields=["subscription_status", "subscription_ends"])

        pending.delete()

        message = "Subscription request approved successfully." if action == "approve" else "Subscription request rejected."
        return Response(
            {
                "message": message,
                "history": _serialize_subscription_tx(history),
                "chef_subscription_status": (chef.subscription_status if chef else None),
                "chef_subscription_ends": (chef.subscription_ends if chef else None),
                "status": status.HTTP_200_OK,
            }
        )


class AdminSubscriptionHistory(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        _profile, profile_error = _require_admin(request)
        if profile_error:
            return profile_error

        queryset = Transaction_history.objects.filter(type__iexact="subscription").order_by("-transaction_time")

        status_filter = str(request.query_params.get("status", "")).strip().lower()
        if status_filter:
            queryset = queryset.filter(status__iexact=status_filter)

        chef_filter = str(request.query_params.get("chef", "")).strip()
        if chef_filter:
            queryset = queryset.filter(chef__icontains=chef_filter)

        search = str(request.query_params.get("search", "")).strip()
        if search:
            queryset = queryset.filter(
                Q(chef__icontains=search)
                | Q(subscription_option_name__icontains=search)
                | Q(transaction_id__icontains=search)
                | Q(transaction_description__icontains=search)
            )

        limit = max(1, min(_safe_int(request.query_params.get("limit"), 500), 2000))
        items = list(queryset[:limit])

        approved_statuses = {"approved", "completed", "active"}
        approved_qs = queryset.filter(status__in=approved_statuses)
        rejected_qs = queryset.filter(status__iexact="rejected")

        return Response(
            {
                "filters": {
                    "status": status_filter,
                    "chef": chef_filter,
                    "search": search,
                    "limit": limit,
                },
                "summary": {
                    "total": queryset.count(),
                    "approved": approved_qs.count(),
                    "rejected": rejected_qs.count(),
                    "total_revenue": float(approved_qs.aggregate(total=Sum("amount")).get("total") or 0),
                },
                "items": [_serialize_subscription_tx(item) for item in items],
                "status": status.HTTP_200_OK,
            }
        )
