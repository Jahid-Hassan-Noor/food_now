from django.db.models import Q
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from admin_app.models import Profile, User_feedback
from admin_app.serializers import User_feedbackSerializer


ALLOWED_ROLES = {"user", "chef", "admin"}
ALLOWED_PRIORITIES = {
    User_feedback.PRIORITY_LOW,
    User_feedback.PRIORITY_NORMAL,
    User_feedback.PRIORITY_HIGH,
}


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


def _build_summary(queryset):
    return {
        "total": queryset.count(),
        "open": queryset.filter(status=User_feedback.STATUS_OPEN).count(),
        "in_review": queryset.filter(status=User_feedback.STATUS_IN_REVIEW).count(),
        "resolved": queryset.filter(status=User_feedback.STATUS_RESOLVED).count(),
    }


def _normalize_priority(value, default):
    priority = str(value or "").strip().lower() or default
    if priority not in ALLOWED_PRIORITIES:
        return None
    return priority


class _BaseUserFeedbackView(APIView):
    permission_classes = [IsAuthenticated]
    category = None

    def _queryset(self, request):
        qs = User_feedback.objects.filter(user=request.user.username, category=self.category).order_by("-created_at")
        search = str(request.query_params.get("search", "")).strip()
        if search:
            qs = qs.filter(
                Q(subject__icontains=search)
                | Q(message__icontains=search)
                | Q(admin_notes__icontains=search)
            )
        return qs, search

    def _list(self, request):
        _profile, profile_error = _require_profile(request)
        if profile_error:
            return profile_error

        queryset, search = self._queryset(request)
        return Response(
            {
                "category": self.category,
                "filters": {"search": search},
                "summary": _build_summary(queryset),
                "items": User_feedbackSerializer(queryset, many=True).data,
                "status": status.HTTP_200_OK,
            }
        )

    def _create(self, request, *, default_subject, success_message, default_priority):
        _profile, profile_error = _require_profile(request)
        if profile_error:
            return profile_error

        subject = str(request.data.get("subject", "")).strip() or default_subject
        message = str(request.data.get("message", "")).strip()
        if not message:
            return Response({"message": "Message is required."}, status=status.HTTP_400_BAD_REQUEST)

        priority = _normalize_priority(request.data.get("priority"), default_priority)
        if not priority:
            return Response(
                {"message": "Invalid priority. Use low, normal, or high."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        rating = request.data.get("rating")
        if self.category == User_feedback.CATEGORY_FEEDBACK:
            if rating in ("", None):
                rating = None
            else:
                try:
                    rating = int(rating)
                except (TypeError, ValueError):
                    return Response({"message": "Rating must be an integer between 1 and 5."}, status=status.HTTP_400_BAD_REQUEST)
                if rating < 1 or rating > 5:
                    return Response({"message": "Rating must be between 1 and 5."}, status=status.HTTP_400_BAD_REQUEST)
        else:
            rating = None

        item = User_feedback.objects.create(
            user=request.user.username,
            email=request.user.email or None,
            category=self.category,
            subject=subject,
            message=message,
            priority=priority,
            rating=rating,
            status=User_feedback.STATUS_OPEN,
        )

        return Response(
            {
                "message": success_message,
                "item": User_feedbackSerializer(item).data,
                "status": status.HTTP_201_CREATED,
            },
            status=status.HTTP_201_CREATED,
        )


class SupportRequests(_BaseUserFeedbackView):
    category = User_feedback.CATEGORY_SUPPORT

    def get(self, request):
        return self._list(request)

    def post(self, request):
        return self._create(
            request,
            default_subject="Support Request",
            success_message="Support request submitted successfully.",
            default_priority=User_feedback.PRIORITY_NORMAL,
        )


class FeedbackRequests(_BaseUserFeedbackView):
    category = User_feedback.CATEGORY_FEEDBACK

    def get(self, request):
        return self._list(request)

    def post(self, request):
        return self._create(
            request,
            default_subject="General Feedback",
            success_message="Feedback submitted successfully.",
            default_priority=User_feedback.PRIORITY_LOW,
        )

