from datetime import timedelta

from django.http import HttpResponse
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from admin_app.models import Dashboard_report_schedule, Profile
from admin_app.services.dashboard_reporting import (
    build_dashboard_csv,
    build_dashboard_pdf,
    build_dashboard_payload,
    resolve_range,
)


class AdminOnlyAPIView(APIView):
    permission_classes = [IsAuthenticated]

    @staticmethod
    def _admin_guard(request):
        if not Profile.objects.filter(user=request.user, role="admin").exists():
            return Response(
                {"detail": "You are not authorized to access this page."},
                status=status.HTTP_403_FORBIDDEN,
            )
        return None


def _get_payload_from_request(request):
    range_info, range_error = resolve_range(
        range_key=request.query_params.get("range", "30d"),
        start_date_raw=request.query_params.get("start_date"),
        end_date_raw=request.query_params.get("end_date"),
    )
    if range_error:
        return None, range_error
    return build_dashboard_payload(range_info), None


class AdminDashboard(AdminOnlyAPIView):
    def get(self, request):
        guard = self._admin_guard(request)
        if guard:
            return guard

        payload, error = _get_payload_from_request(request)
        if error:
            return Response(error, status=status.HTTP_400_BAD_REQUEST)

        export_format = str(request.query_params.get("export_format", "")).strip().lower()
        if export_format in {"csv", "pdf"}:
            start_date = payload["range"]["start_date"]
            end_date = payload["range"]["end_date"]
            if export_format == "pdf":
                pdf_bytes = build_dashboard_pdf(payload)
                filename = f"admin-dashboard-report-{start_date}-{end_date}.pdf"
                export_response = HttpResponse(pdf_bytes, content_type="application/pdf")
                export_response["Content-Disposition"] = f'attachment; filename="{filename}"'
                return export_response

            csv_content = build_dashboard_csv(payload)
            filename = f"admin-dashboard-report-{start_date}-{end_date}.csv"
            export_response = HttpResponse(csv_content, content_type="text/csv")
            export_response["Content-Disposition"] = f'attachment; filename="{filename}"'
            return export_response

        # Keep earlier aggregate keys for backward compatibility.
        summary = payload["summary"]
        return Response(
            {
                **payload,
                "user_count": summary["total_users"],
                "chef_count": summary["total_chefs"],
                "campaign_count": summary["campaigns_in_range"],
                "order_count": summary["orders_in_range"],
                "status": status.HTTP_200_OK,
            }
        )


class AdminDashboardExport(AdminOnlyAPIView):
    def get(self, request):
        guard = self._admin_guard(request)
        if guard:
            return guard

        payload, error = _get_payload_from_request(request)
        if error:
            return Response(error, status=status.HTTP_400_BAD_REQUEST)

        export_format = str(request.query_params.get("format", "csv")).strip().lower()
        if export_format not in {"csv", "pdf"}:
            return Response(
                {"detail": "Invalid export format. Use csv or pdf."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        start_date = payload["range"]["start_date"]
        end_date = payload["range"]["end_date"]

        if export_format == "pdf":
            pdf_bytes = build_dashboard_pdf(payload)
            filename = f"admin-dashboard-report-{start_date}-{end_date}.pdf"
            response = HttpResponse(pdf_bytes, content_type="application/pdf")
            response["Content-Disposition"] = f'attachment; filename="{filename}"'
            return response

        csv_content = build_dashboard_csv(payload)
        filename = f"admin-dashboard-report-{start_date}-{end_date}.csv"
        response = HttpResponse(csv_content, content_type="text/csv")
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        return response


class DashboardReportScheduleView(AdminOnlyAPIView):
    def get(self, request):
        guard = self._admin_guard(request)
        if guard:
            return guard

        schedules = Dashboard_report_schedule.objects.all().order_by("email")
        return Response(
            {
                "schedules": [
                    {
                        "id": schedule.id,
                        "email": schedule.email,
                        "frequency": schedule.frequency,
                        "is_active": schedule.is_active,
                        "next_run_at": schedule.next_run_at,
                        "last_sent_at": schedule.last_sent_at,
                        "updated_at": schedule.updated_at,
                    }
                    for schedule in schedules
                ],
                "status": status.HTTP_200_OK,
            }
        )

    def post(self, request):
        guard = self._admin_guard(request)
        if guard:
            return guard

        email = str(request.data.get("email", "")).strip().lower()
        frequency = str(request.data.get("frequency", Dashboard_report_schedule.FREQUENCY_WEEKLY)).strip().lower()
        is_active = bool(request.data.get("is_active", True))

        if not email:
            return Response({"detail": "Email is required."}, status=status.HTTP_400_BAD_REQUEST)

        allowed_frequencies = {
            Dashboard_report_schedule.FREQUENCY_WEEKLY,
            Dashboard_report_schedule.FREQUENCY_MONTHLY,
        }
        if frequency not in allowed_frequencies:
            return Response(
                {"detail": "Invalid frequency. Use weekly or monthly."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        now = timezone.now()
        offset = timedelta(days=7 if frequency == Dashboard_report_schedule.FREQUENCY_WEEKLY else 30)
        schedule, created = Dashboard_report_schedule.objects.get_or_create(
            email=email,
            defaults={
                "frequency": frequency,
                "is_active": is_active,
                "next_run_at": now + offset,
            },
        )

        if not created:
            schedule.frequency = frequency
            schedule.is_active = is_active
            if schedule.next_run_at is None or schedule.next_run_at < now:
                schedule.next_run_at = now + offset
            schedule.save(update_fields=["frequency", "is_active", "next_run_at", "updated_at"])

        return Response(
            {
                "schedule": {
                    "id": schedule.id,
                    "email": schedule.email,
                    "frequency": schedule.frequency,
                    "is_active": schedule.is_active,
                    "next_run_at": schedule.next_run_at,
                    "last_sent_at": schedule.last_sent_at,
                    "updated_at": schedule.updated_at,
                },
                "message": "Report schedule saved successfully.",
                "status": status.HTTP_200_OK,
            }
        )
