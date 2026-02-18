from django.db.models import Q
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from admin_app.models import Profile, User_feedback
from admin_app.serializers import User_feedbackSerializer


ALLOWED_STATUSES = {
    User_feedback.STATUS_OPEN,
    User_feedback.STATUS_IN_REVIEW,
    User_feedback.STATUS_RESOLVED,
}
ALLOWED_PRIORITIES = {
    User_feedback.PRIORITY_LOW,
    User_feedback.PRIORITY_NORMAL,
    User_feedback.PRIORITY_HIGH,
}
ALLOWED_CATEGORIES = {
    User_feedback.CATEGORY_SUPPORT,
    User_feedback.CATEGORY_FEEDBACK,
}


def _require_admin(request):
    profile = Profile.objects.filter(user=request.user).first()
    if not profile:
        return None, Response({"message": "Profile not found"}, status=status.HTTP_404_NOT_FOUND)

    if profile.role != "admin":
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
        "support": queryset.filter(category=User_feedback.CATEGORY_SUPPORT).count(),
        "feedback": queryset.filter(category=User_feedback.CATEGORY_FEEDBACK).count(),
    }


class UserFeedbacksAdmin(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        _profile, profile_error = _require_admin(request)
        if profile_error:
            return profile_error

        queryset = User_feedback.objects.all().order_by("-created_at")

        category = str(request.query_params.get("category", "")).strip().lower()
        status_filter = str(request.query_params.get("status", "")).strip().lower()
        priority = str(request.query_params.get("priority", "")).strip().lower()
        search = str(request.query_params.get("search", "")).strip()

        if category:
            if category not in ALLOWED_CATEGORIES:
                return Response(
                    {"message": "Invalid category. Use support or feedback."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            queryset = queryset.filter(category=category)

        if status_filter:
            if status_filter not in ALLOWED_STATUSES:
                return Response(
                    {"message": "Invalid status. Use open, in_review, or resolved."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            queryset = queryset.filter(status=status_filter)

        if priority:
            if priority not in ALLOWED_PRIORITIES:
                return Response(
                    {"message": "Invalid priority. Use low, normal, or high."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            queryset = queryset.filter(priority=priority)

        if search:
            queryset = queryset.filter(
                Q(user__icontains=search)
                | Q(email__icontains=search)
                | Q(subject__icontains=search)
                | Q(message__icontains=search)
                | Q(admin_notes__icontains=search)
            )

        limit_raw = request.query_params.get("limit", 200)
        try:
            limit = int(limit_raw)
        except (TypeError, ValueError):
            limit = 200
        limit = max(1, min(limit, 1000))

        items = list(queryset[:limit])

        return Response(
            {
                "filters": {
                    "category": category,
                    "status": status_filter,
                    "priority": priority,
                    "search": search,
                    "limit": limit,
                },
                "summary": _build_summary(queryset),
                "feedbacks": User_feedbackSerializer(items, many=True).data,
                "status": status.HTTP_200_OK,
            }
        )


class UserFeedbacksAdminDetail(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, feedback_id):
        _profile, profile_error = _require_admin(request)
        if profile_error:
            return profile_error

        item = User_feedback.objects.filter(pk=feedback_id).first()
        if not item:
            return Response({"message": "Feedback entry not found."}, status=status.HTTP_404_NOT_FOUND)

        update_fields = []

        if "status" in request.data:
            status_value = str(request.data.get("status", "")).strip().lower()
            if status_value not in ALLOWED_STATUSES:
                return Response(
                    {"message": "Invalid status. Use open, in_review, or resolved."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            item.status = status_value
            update_fields.append("status")

        if "priority" in request.data:
            priority_value = str(request.data.get("priority", "")).strip().lower()
            if priority_value not in ALLOWED_PRIORITIES:
                return Response(
                    {"message": "Invalid priority. Use low, normal, or high."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            item.priority = priority_value
            update_fields.append("priority")

        if "admin_notes" in request.data:
            item.admin_notes = str(request.data.get("admin_notes", "")).strip()
            update_fields.append("admin_notes")

        if not update_fields:
            return Response(
                {"message": "No valid fields provided for update."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        update_fields.append("updated_at")
        item.save(update_fields=update_fields)

        return Response(
            {
                "message": "Feedback entry updated successfully.",
                "feedback": User_feedbackSerializer(item).data,
                "status": status.HTTP_200_OK,
            }
        )

    def delete(self, request, feedback_id):
        _profile, profile_error = _require_admin(request)
        if profile_error:
            return profile_error

        item = User_feedback.objects.filter(pk=feedback_id).first()
        if not item:
            return Response({"message": "Feedback entry not found."}, status=status.HTTP_404_NOT_FOUND)

        item.delete()
        return Response(
            {
                "message": "Feedback entry deleted successfully.",
                "status": status.HTTP_200_OK,
            }
        )

