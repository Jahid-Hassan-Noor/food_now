import uuid

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("admin_app", "0006_dashboard_report_schedule"),
    ]

    operations = [
        migrations.CreateModel(
            name="User_feedback",
            fields=[
                ("uid", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("user", models.CharField(db_index=True, max_length=150)),
                ("email", models.EmailField(blank=True, max_length=254, null=True)),
                (
                    "category",
                    models.CharField(
                        choices=[("support", "Support"), ("feedback", "Feedback")],
                        db_index=True,
                        default="feedback",
                        max_length=20,
                    ),
                ),
                ("subject", models.CharField(max_length=200)),
                ("message", models.TextField()),
                ("rating", models.PositiveSmallIntegerField(blank=True, null=True)),
                (
                    "priority",
                    models.CharField(
                        choices=[("low", "Low"), ("normal", "Normal"), ("high", "High")],
                        db_index=True,
                        default="normal",
                        max_length=20,
                    ),
                ),
                (
                    "status",
                    models.CharField(
                        choices=[("open", "Open"), ("in_review", "In Review"), ("resolved", "Resolved")],
                        db_index=True,
                        default="open",
                        max_length=20,
                    ),
                ),
                ("admin_notes", models.TextField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "ordering": ("-created_at",),
            },
        ),
    ]

