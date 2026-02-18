from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("admin_app", "0007_user_feedback"),
    ]

    operations = [
        migrations.AddField(
            model_name="pending_transaction",
            name="subscription_duration_months",
            field=models.PositiveIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="pending_transaction",
            name="subscription_option_id",
            field=models.PositiveIntegerField(blank=True, db_index=True, null=True),
        ),
        migrations.AddField(
            model_name="pending_transaction",
            name="subscription_option_name",
            field=models.CharField(blank=True, max_length=150, null=True),
        ),
        migrations.AddField(
            model_name="transaction_history",
            name="subscription_duration_months",
            field=models.PositiveIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="transaction_history",
            name="subscription_option_id",
            field=models.PositiveIntegerField(blank=True, db_index=True, null=True),
        ),
        migrations.AddField(
            model_name="transaction_history",
            name="subscription_option_name",
            field=models.CharField(blank=True, max_length=150, null=True),
        ),
    ]
