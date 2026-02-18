from datetime import timedelta

from django.core.mail import EmailMessage
from django.core.management.base import BaseCommand
from django.utils import timezone

from admin_app.models import Dashboard_report_schedule
from admin_app.services.dashboard_reporting import build_dashboard_csv, build_dashboard_payload, resolve_range


class Command(BaseCommand):
    help = "Send scheduled admin dashboard reports (weekly/monthly) via email."

    def handle(self, *args, **options):
        now = timezone.now()
        due_schedules = Dashboard_report_schedule.objects.filter(is_active=True, next_run_at__lte=now).order_by(
            "next_run_at"
        )

        if not due_schedules.exists():
            self.stdout.write(self.style.SUCCESS("No scheduled dashboard reports are due."))
            return

        sent_count = 0
        failed_count = 0

        for schedule in due_schedules:
            if schedule.frequency == Dashboard_report_schedule.FREQUENCY_MONTHLY:
                range_key = "month"
                next_offset = timedelta(days=30)
            else:
                range_key = "7d"
                next_offset = timedelta(days=7)

            range_info, range_error = resolve_range(range_key=range_key)
            if range_error:
                failed_count += 1
                self.stderr.write(
                    self.style.ERROR(f"Skipping schedule {schedule.email}: invalid range ({range_error}).")
                )
                continue

            payload = build_dashboard_payload(range_info)
            csv_content = build_dashboard_csv(payload)

            subject = f"Food Now Admin Dashboard Report ({payload['range']['label']})"
            body = (
                "Hello Admin,\n\n"
                "Please find the attached scheduled dashboard report.\n\n"
                f"Range: {payload['range']['start_date']} to {payload['range']['end_date']}\n"
                f"Generated at: {now.isoformat()}\n\n"
                "Regards,\nFood Now"
            )
            filename = f"admin-dashboard-report-{payload['range']['start_date']}-{payload['range']['end_date']}.csv"

            email = EmailMessage(
                subject=subject,
                body=body,
                to=[schedule.email],
            )
            email.attach(filename, csv_content, "text/csv")

            try:
                email.send(fail_silently=False)
                schedule.last_sent_at = now
                schedule.next_run_at = now + next_offset
                schedule.save(update_fields=["last_sent_at", "next_run_at", "updated_at"])
                sent_count += 1
                self.stdout.write(self.style.SUCCESS(f"Sent report to {schedule.email}."))
            except Exception as exc:
                failed_count += 1
                self.stderr.write(self.style.ERROR(f"Failed sending to {schedule.email}: {exc}"))

        self.stdout.write(
            self.style.SUCCESS(
                f"Scheduled dashboard report job complete. Sent: {sent_count}, Failed: {failed_count}."
            )
        )
