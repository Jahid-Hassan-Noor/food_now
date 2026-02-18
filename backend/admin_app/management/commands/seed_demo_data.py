from __future__ import annotations

import random
from collections import defaultdict
from datetime import datetime, time, timedelta

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand
from django.db import transaction
from django.db.models import Q
from django.utils import timezone

from admin_app.models import (
    Dashboard_report_schedule,
    Pending_transaction,
    Profile,
    Setting,
    Subscription_option,
    Transaction_history,
    User_feedback,
)
from user_app.models import Campaign, Campaign_history, Chef, Food, Order, Order_history


DEMO_PASSWORD = "DemoPass123!"
DEMO_TAG = "[DEMO]"

DEMO_ADMIN = {
    "username": "demo_admin",
    "email": "demo_admin@foodnow.local",
    "first_name": "Demo",
    "last_name": "Admin",
    "role": "admin",
}

DEMO_CHEFS = [
    {
        "username": "demo_chef_azlan",
        "email": "demo_chef_azlan@foodnow.local",
        "first_name": "Azlan",
        "last_name": "Rahman",
        "description": "Malay comfort specialist with campus-friendly meal sets.",
        "subscription_status": "Active",
        "foods": [
            ("Nasi Lemak Special", 8.90),
            ("Ayam Goreng Berempah", 10.50),
            ("Roti Canai Set", 6.80),
            ("Mee Goreng Mamak", 9.20),
            ("Teh Tarik", 3.20),
            ("Kuih Seri Muka", 4.10),
        ],
    },
    {
        "username": "demo_chef_nadia",
        "email": "demo_chef_nadia@foodnow.local",
        "first_name": "Nadia",
        "last_name": "Salleh",
        "description": "Healthy bowls and fusion rice meals for students.",
        "subscription_status": "Active",
        "foods": [
            ("Grilled Chicken Bowl", 12.40),
            ("Spicy Tuna Rice Bowl", 11.70),
            ("Vegan Tofu Bowl", 10.90),
            ("Fruit Yogurt Cup", 5.60),
            ("Lemon Mint Cooler", 4.50),
            ("Pasta Aglio Olio", 13.20),
        ],
    },
    {
        "username": "demo_chef_hakim",
        "email": "demo_chef_hakim@foodnow.local",
        "first_name": "Hakim",
        "last_name": "Idrus",
        "description": "Late-night favourites and premium snack boxes.",
        "subscription_status": "Expired",
        "foods": [
            ("Beef Burger Combo", 14.90),
            ("Chicken Wrap Deluxe", 12.20),
            ("Loaded Fries", 8.40),
            ("Cheese Sausage Roll", 7.30),
            ("Iced Chocolate", 5.40),
            ("Mini Donut Box", 6.90),
        ],
    },
]

DEMO_USERS = [
    {
        "username": "demo_user_01",
        "email": "demo_user_01@foodnow.local",
        "first_name": "Aiman",
        "last_name": "Yusof",
    },
    {
        "username": "demo_user_02",
        "email": "demo_user_02@foodnow.local",
        "first_name": "Siti",
        "last_name": "Zainal",
    },
    {
        "username": "demo_user_03",
        "email": "demo_user_03@foodnow.local",
        "first_name": "Irfan",
        "last_name": "Latif",
    },
    {
        "username": "demo_user_04",
        "email": "demo_user_04@foodnow.local",
        "first_name": "Nurul",
        "last_name": "Adibah",
    },
    {
        "username": "demo_user_05",
        "email": "demo_user_05@foodnow.local",
        "first_name": "Daniel",
        "last_name": "Tan",
    },
    {
        "username": "demo_user_06",
        "email": "demo_user_06@foodnow.local",
        "first_name": "Fatimah",
        "last_name": "Hamid",
    },
    {
        "username": "demo_user_07",
        "email": "demo_user_07@foodnow.local",
        "first_name": "Jason",
        "last_name": "Lim",
    },
    {
        "username": "demo_user_08",
        "email": "demo_user_08@foodnow.local",
        "first_name": "Amira",
        "last_name": "Hassan",
    },
]


def _aware_datetime(day, *, hour, minute):
    naive = datetime.combine(day, time(hour=hour, minute=minute))
    if timezone.is_naive(naive):
        return timezone.make_aware(naive, timezone.get_current_timezone())
    return naive


class Command(BaseCommand):
    help = "Seed realistic demo data for dashboards, campaigns, orders, and transactions."

    def add_arguments(self, parser):
        parser.add_argument(
            "--password",
            default=DEMO_PASSWORD,
            help=f"Password to set for all demo accounts (default: {DEMO_PASSWORD}).",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        password = options["password"]
        rng = random.Random(20260217)
        now = timezone.now()
        today = timezone.localdate()

        account_info = self._upsert_demo_accounts(password=password, now=now)
        self._clear_existing_demo_domain_data(
            chef_usernames=account_info["chef_usernames"],
            user_usernames=account_info["user_usernames"],
        )

        foods_by_chef, food_price_map = self._seed_foods(
            chef_specs=DEMO_CHEFS,
        )
        campaigns_created = self._seed_campaigns(
            chef_specs=DEMO_CHEFS,
            foods_by_chef=foods_by_chef,
            rng=rng,
            today=today,
            now=now,
        )
        order_stats = self._seed_orders(
            user_usernames=account_info["user_usernames"],
            chef_usernames=account_info["chef_usernames"],
            foods_by_chef=foods_by_chef,
            food_price_map=food_price_map,
            rng=rng,
            today=today,
        )
        transaction_stats = self._seed_transactions(
            chef_usernames=account_info["chef_usernames"],
            rng=rng,
            today=today,
        )

        self._update_chef_rollups(
            chef_specs=DEMO_CHEFS,
            chef_usernames=account_info["chef_usernames"],
            order_stats=order_stats,
            transaction_stats=transaction_stats,
            today=today,
            now=now,
        )
        self._update_user_profiles(
            user_usernames=account_info["user_usernames"],
            order_stats=order_stats,
        )
        feedback_stats = self._seed_auxiliary_records(
            now=now,
            user_usernames=account_info["user_usernames"],
            chef_usernames=account_info["chef_usernames"],
            rng=rng,
            today=today,
        )

        self.stdout.write(self.style.SUCCESS("Demo data seeding completed successfully."))
        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("Demo Login Accounts"))
        self.stdout.write(f"Admin: {DEMO_ADMIN['username']} / {password}")
        for chef in DEMO_CHEFS:
            self.stdout.write(f"Chef: {chef['username']} / {password}")
        for user in DEMO_USERS[:3]:
            self.stdout.write(f"User: {user['username']} / {password}")

        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("Seed Summary"))
        self.stdout.write(
            f"Users: {len(account_info['user_usernames'])}, "
            f"Chefs: {len(account_info['chef_usernames'])}, "
            f"Foods: {sum(len(items) for items in foods_by_chef.values())}, "
            f"Campaigns: {campaigns_created['campaigns']}, "
            f"Legacy Campaign History: {campaigns_created['campaign_history']}, "
            f"Pending Orders: {order_stats['pending_count']}, "
            f"Order History: {order_stats['history_count']}, "
            f"Pending Transactions: {transaction_stats['pending_count']}, "
            f"Transaction History: {transaction_stats['history_count']}, "
            f"Pending Subscription Requests: {transaction_stats['subscription_pending_count']}, "
            f"Subscription History Records: {transaction_stats['subscription_history_count']}, "
            f"Feedback Entries: {feedback_stats['feedback_count']}"
        )

    def _upsert_demo_accounts(self, *, password, now):
        self._upsert_user_profile(
            username=DEMO_ADMIN["username"],
            email=DEMO_ADMIN["email"],
            first_name=DEMO_ADMIN["first_name"],
            last_name=DEMO_ADMIN["last_name"],
            role=DEMO_ADMIN["role"],
            password=password,
        )

        chef_usernames = []
        for idx, chef in enumerate(DEMO_CHEFS, start=1):
            user, _profile = self._upsert_user_profile(
                username=chef["username"],
                email=chef["email"],
                first_name=chef["first_name"],
                last_name=chef["last_name"],
                role="chef",
                password=password,
            )
            chef_usernames.append(user.username)

            subscription_status = chef["subscription_status"]
            if subscription_status.lower() == "active":
                subscription_ends = now + timedelta(days=90 + (idx * 5))
            else:
                subscription_ends = now - timedelta(days=10 + idx)

            Chef.objects.update_or_create(
                chef_username=user.username,
                defaults={
                    "chef_description": f"{DEMO_TAG} {chef['description']}",
                    "chef_image": "chef_images/default.png",
                    "balance": 0.0,
                    "total_orders_received": 0,
                    "total_deposit": 0,
                    "total_campaigns": 0,
                    "subscription_status": subscription_status,
                    "subscription_ends": subscription_ends,
                    "campaign_points": 0,
                    "last_month_sales": 0.0,
                    "this_month_sales": 0.0,
                    "sales_january": 0.0,
                    "sales_february": 0.0,
                    "sales_march": 0.0,
                    "sales_april": 0.0,
                    "sales_may": 0.0,
                    "sales_june": 0.0,
                    "sales_july": 0.0,
                    "sales_august": 0.0,
                    "sales_september": 0.0,
                    "sales_october": 0.0,
                    "sales_november": 0.0,
                    "sales_december": 0.0,
                },
            )

        user_usernames = []
        for idx, demo_user in enumerate(DEMO_USERS, start=1):
            user, profile = self._upsert_user_profile(
                username=demo_user["username"],
                email=demo_user["email"],
                first_name=demo_user["first_name"],
                last_name=demo_user["last_name"],
                role="user",
                password=password,
            )
            profile.aiu_id = profile.aiu_id or f"AIU{5000 + idx}"
            profile.room_number = profile.room_number or f"D-{idx:03d}"
            profile.save(update_fields=["aiu_id", "room_number"])
            user_usernames.append(user.username)

        return {
            "chef_usernames": chef_usernames,
            "user_usernames": user_usernames,
        }

    def _upsert_user_profile(self, *, username, email, first_name, last_name, role, password):
        user, _created = User.objects.get_or_create(
            username=username,
            defaults={
                "email": email,
                "first_name": first_name,
                "last_name": last_name,
            },
        )

        changed = False
        if user.email != email:
            user.email = email
            changed = True
        if user.first_name != first_name:
            user.first_name = first_name
            changed = True
        if user.last_name != last_name:
            user.last_name = last_name
            changed = True

        user.set_password(password)
        changed = True
        if changed:
            user.save()

        profile, _created = Profile.objects.get_or_create(user=user)
        if profile.role != role:
            profile.role = role
            profile.save(update_fields=["role"])

        return user, profile

    def _clear_existing_demo_domain_data(self, *, chef_usernames, user_usernames):
        Campaign.objects.filter(chef__in=chef_usernames).delete()
        Campaign_history.objects.filter(chef__in=chef_usernames).delete()
        Food.objects.filter(chef__in=chef_usernames).delete()
        Order.objects.filter(user__in=user_usernames).delete()
        Order_history.objects.filter(user__in=user_usernames).delete()
        Pending_transaction.objects.filter(chef__in=chef_usernames).delete()
        Transaction_history.objects.filter(chef__in=chef_usernames).delete()

    def _seed_foods(self, *, chef_specs):
        foods_by_chef = defaultdict(list)
        food_price_map = {}

        for chef in chef_specs:
            chef_username = chef["username"]
            for food_name, food_price in chef["foods"]:
                food = Food.objects.create(
                    food_name=food_name,
                    food_description=f"{DEMO_TAG} Signature item prepared by {chef_username}.",
                    chef=chef_username,
                    food_price=float(food_price),
                    food_image="food_images/default.png",
                )
                food_id = str(food.uid)
                foods_by_chef[chef_username].append(food_id)
                food_price_map[food_id] = float(food_price)

        return foods_by_chef, food_price_map

    def _seed_campaigns(self, *, chef_specs, foods_by_chef, rng, today, now):
        campaign_count = 0
        history_count = 0

        for chef in chef_specs:
            chef_username = chef["username"]
            chef_food_ids = foods_by_chef[chef_username]
            if not chef_food_ids:
                continue

            # 2 active/running campaigns.
            for day_offset in (2, 0):
                start_day = today - timedelta(days=day_offset)
                start_at = _aware_datetime(start_day, hour=10 + day_offset, minute=15)
                end_at = now + timedelta(hours=8 + day_offset)
                food_ids = rng.sample(chef_food_ids, k=min(3, len(chef_food_ids)))
                food_items = {food_id: rng.randint(8, 20) for food_id in food_ids}
                campaign_count += 1
                Campaign.objects.create(
                    chef=chef_username,
                    status="running",
                    food_status="cooking",
                    title=f"{DEMO_TAG} {chef_username} Lunch Rush #{campaign_count}",
                    campaign_description=f"{DEMO_TAG} Fast-selling lunch campaign for campus peak hours.",
                    food_items=food_items,
                    start_time=start_at,
                    end_time=end_at,
                    delivery_time=end_at + timedelta(hours=1),
                    quantity_available=sum(food_items.values()),
                    total_orders=rng.randint(5, 18),
                )

            # 1 scheduled campaign (still status running, starts in future).
            future_start = _aware_datetime(today + timedelta(days=1), hour=18, minute=0)
            future_end = future_start + timedelta(hours=5)
            food_ids = rng.sample(chef_food_ids, k=min(2, len(chef_food_ids)))
            food_items = {food_id: rng.randint(10, 24) for food_id in food_ids}
            campaign_count += 1
            Campaign.objects.create(
                chef=chef_username,
                status="running",
                food_status="prep",
                title=f"{DEMO_TAG} {chef_username} Evening Specials",
                campaign_description=f"{DEMO_TAG} Scheduled evening campaign for late classes.",
                food_items=food_items,
                start_time=future_start,
                end_time=future_end,
                delivery_time=future_end + timedelta(hours=1),
                quantity_available=sum(food_items.values()),
                total_orders=0,
            )

            # 3 completed/cancelled campaigns in the last 30 days.
            history_templates = [
                ("completed", 6, "Breakfast Fiesta"),
                ("completed", 12, "Dinner Value Set"),
                ("cancelled", 18, "Rainy Day Promo"),
            ]
            for status_value, day_offset, label in history_templates:
                start_day = today - timedelta(days=day_offset)
                start_at = _aware_datetime(start_day, hour=9 + (day_offset % 4), minute=30)
                end_at = start_at + timedelta(hours=5)
                food_ids = rng.sample(chef_food_ids, k=min(3, len(chef_food_ids)))
                food_items = {food_id: rng.randint(6, 16) for food_id in food_ids}
                campaign_count += 1
                Campaign.objects.create(
                    chef=chef_username,
                    status=status_value,
                    food_status="closed",
                    title=f"{DEMO_TAG} {chef_username} {label}",
                    campaign_description=f"{DEMO_TAG} Historical campaign used for analytics testing.",
                    food_items=food_items,
                    start_time=start_at,
                    end_time=end_at,
                    delivery_time=end_at + timedelta(hours=1),
                    quantity_available=sum(food_items.values()),
                    total_orders=rng.randint(8, 34),
                )

            # Legacy campaign history rows for compatibility testing.
            for idx, day_offset in enumerate((45, 75), start=1):
                start_day = today - timedelta(days=day_offset)
                start_at = _aware_datetime(start_day, hour=11, minute=0)
                end_at = start_at + timedelta(hours=4)
                history_count += 1
                Campaign_history.objects.create(
                    chef=chef_username,
                    status="completed" if idx == 1 else "cancelled",
                    title=f"{DEMO_TAG} Legacy Campaign {idx} ({chef_username})",
                    campaign_description=f"{DEMO_TAG} Legacy campaign row for history page coverage.",
                    food_ids="",
                    start_time=start_at,
                    end_time=end_at,
                    delivery_time=end_at + timedelta(hours=1),
                    total_orders=rng.randint(5, 22),
                )

        return {
            "campaigns": campaign_count,
            "campaign_history": history_count,
        }

    def _seed_orders(self, *, user_usernames, chef_usernames, foods_by_chef, food_price_map, rng, today):
        user_order_counts = defaultdict(int)
        user_last_order_at = {}
        chef_order_counts = defaultdict(int)
        chef_revenue_by_month = defaultdict(lambda: defaultdict(float))

        pending_count = 0
        history_count = 0

        def register_rollup(*, username, chef_username, total_price, order_time):
            user_order_counts[username] += 1
            chef_order_counts[chef_username] += 1
            chef_revenue_by_month[chef_username][order_time.month] += float(total_price)
            existing = user_last_order_at.get(username)
            if not existing or order_time > existing:
                user_last_order_at[username] = order_time

        # Pending/current orders in last 30 days.
        for day_offset in range(0, 30):
            day = today - timedelta(days=day_offset)
            daily_count = rng.randint(1, 3)
            for _ in range(daily_count):
                username = rng.choice(user_usernames)
                chef_username = rng.choice(chef_usernames)
                food_pool = foods_by_chef[chef_username]
                selected = rng.sample(food_pool, k=min(rng.randint(1, 3), len(food_pool)))
                quantity = rng.randint(1, 4)
                amount = round(sum(food_price_map[fid] for fid in selected) * quantity, 2)

                order = Order.objects.create(
                    user=username,
                    user_address=f"AIU Residence Block {rng.randint(1, 7)}",
                    user_phone=f"01{rng.randint(10000000, 99999999)}",
                    quantity=quantity,
                    food_items=",".join(selected),
                    custom_order_details=f"{DEMO_TAG} Pending order generated by seed.",
                    food_price=amount,
                )
                order_time = _aware_datetime(
                    day,
                    hour=rng.randint(9, 22),
                    minute=rng.choice([0, 10, 20, 30, 40, 50]),
                )
                Order.objects.filter(pk=order.pk).update(order_time=order_time)
                register_rollup(
                    username=username,
                    chef_username=chef_username,
                    total_price=amount,
                    order_time=order_time,
                )
                pending_count += 1

        # Historical orders in last 120 days.
        for day_offset in range(5, 121):
            day = today - timedelta(days=day_offset)
            daily_count = rng.randint(0, 2)
            for idx in range(daily_count):
                username = rng.choice(user_usernames)
                chef_username = rng.choice(chef_usernames)
                food_pool = foods_by_chef[chef_username]
                selected = rng.sample(food_pool, k=min(rng.randint(1, 3), len(food_pool)))
                quantity = rng.randint(1, 5)
                amount = round(sum(food_price_map[fid] for fid in selected) * quantity, 2)

                history = Order_history.objects.create(
                    user=username,
                    quantity=quantity,
                    food_items=",".join(selected),
                    food_price=amount,
                    order_id=f"DEMO-H-{day.strftime('%m%d')}-{idx + 1}-{rng.randint(100, 999)}",
                )
                order_time = _aware_datetime(
                    day,
                    hour=rng.randint(8, 21),
                    minute=rng.choice([0, 15, 30, 45]),
                )
                Order_history.objects.filter(pk=history.pk).update(order_time=order_time)
                register_rollup(
                    username=username,
                    chef_username=chef_username,
                    total_price=amount,
                    order_time=order_time,
                )
                history_count += 1

        return {
            "pending_count": pending_count,
            "history_count": history_count,
            "user_order_counts": user_order_counts,
            "user_last_order_at": user_last_order_at,
            "chef_order_counts": chef_order_counts,
            "chef_revenue_by_month": chef_revenue_by_month,
        }

    def _seed_transactions(self, *, chef_usernames, rng, today):
        current_year = today.year
        pending_count = 0
        history_count = 0
        subscription_pending_count = 0
        subscription_history_count = 0
        deposit_by_chef = defaultdict(float)

        # Completed transactions across all months (for yearly charts).
        for month in range(1, 13):
            for chef_username in chef_usernames:
                amount = round(rng.uniform(140, 920), 2)
                tx = Transaction_history.objects.create(
                    status="completed",
                    chef=chef_username,
                    type="recharge",
                    transaction_description=f"{DEMO_TAG} Completed monthly recharge for analytics.",
                    transaction_proof="transaction_proofs/demo-proof.png",
                    transaction_id=f"DEMO-TX-{current_year}-{month:02d}-{chef_username[-2:]}-{rng.randint(1000,9999)}",
                    amount=amount,
                )
                tx_time = _aware_datetime(
                    today.replace(month=month, day=min(15, 28)),
                    hour=rng.randint(10, 17),
                    minute=rng.choice([0, 20, 40]),
                )
                Transaction_history.objects.filter(pk=tx.pk).update(transaction_time=tx_time)
                history_count += 1
                deposit_by_chef[chef_username] += amount

        # Pending transactions concentrated in last 30 days (for daily chart + top up pages).
        for day_offset in range(0, 30, 2):
            day = today - timedelta(days=day_offset)
            daily_entries = rng.randint(1, 2)
            for _ in range(daily_entries):
                chef_username = rng.choice(chef_usernames)
                amount = round(rng.uniform(60, 320), 2)
                pending = Pending_transaction.objects.create(
                    status="pending",
                    chef=chef_username,
                    type="recharge",
                    transaction_description=f"{DEMO_TAG} Pending recharge under review.",
                    transaction_proof="transaction_proofs/demo-proof.png",
                    amount=amount,
                )
                pending_time = _aware_datetime(
                    day,
                    hour=rng.randint(9, 21),
                    minute=rng.choice([0, 15, 30, 45]),
                )
                Pending_transaction.objects.filter(pk=pending.pk).update(transaction_time=pending_time)
                pending_count += 1
                deposit_by_chef[chef_username] += amount

        plans = [
            ("Basic Student Plan", 1, 29.0, "Best for new chefs starting in campus."),
            ("Growth Plan", 3, 79.0, "For active chefs with frequent campaigns."),
            ("Pro Kitchen Plan", 6, 149.0, "For high-volume chefs and premium listings."),
        ]
        subscription_options = []
        for name, months, price, description in plans:
            option, _ = Subscription_option.objects.update_or_create(
                name=name,
                defaults={
                    "duration_months": months,
                    "price": price,
                    "description": f"{DEMO_TAG} {description}",
                },
            )
            subscription_options.append(option)

        if not subscription_options:
            return {
                "pending_count": pending_count,
                "history_count": history_count,
                "subscription_pending_count": subscription_pending_count,
                "subscription_history_count": subscription_history_count,
                "deposit_by_chef": deposit_by_chef,
            }

        for idx, chef_username in enumerate(chef_usernames):
            option = subscription_options[idx % len(subscription_options)]
            history_status = "approved" if idx < 2 else "rejected"
            history = Transaction_history.objects.create(
                status=history_status,
                chef=chef_username,
                type="subscription",
                subscription_option_id=option.id,
                subscription_option_name=option.name,
                subscription_duration_months=option.duration_months,
                transaction_description=f"{DEMO_TAG} {history_status.title()} subscription request for {option.name}.",
                transaction_proof="transaction_proofs/demo-proof.png",
                transaction_id=f"DEMO-SUB-{current_year}-{idx+1:02d}-{rng.randint(1000,9999)}",
                amount=float(option.price),
            )
            history_time = _aware_datetime(
                today - timedelta(days=35 + (idx * 8)),
                hour=rng.randint(10, 18),
                minute=rng.choice([0, 20, 40]),
            )
            Transaction_history.objects.filter(pk=history.pk).update(transaction_time=history_time)
            history_count += 1
            subscription_history_count += 1

        for idx, chef_username in enumerate(chef_usernames):
            if idx == 0:
                continue
            option = subscription_options[(idx + 1) % len(subscription_options)]
            pending = Pending_transaction.objects.create(
                status="pending",
                chef=chef_username,
                type="subscription",
                subscription_option_id=option.id,
                subscription_option_name=option.name,
                subscription_duration_months=option.duration_months,
                transaction_description=f"{DEMO_TAG} Pending subscription request for {option.name}.",
                transaction_proof="transaction_proofs/demo-proof.png",
                amount=float(option.price),
            )
            pending_time = _aware_datetime(
                today - timedelta(days=idx + 1),
                hour=rng.randint(9, 22),
                minute=rng.choice([5, 15, 25, 35, 45, 55]),
            )
            Pending_transaction.objects.filter(pk=pending.pk).update(transaction_time=pending_time)
            pending_count += 1
            subscription_pending_count += 1

        return {
            "pending_count": pending_count,
            "history_count": history_count,
            "subscription_pending_count": subscription_pending_count,
            "subscription_history_count": subscription_history_count,
            "deposit_by_chef": deposit_by_chef,
        }

    def _update_chef_rollups(self, *, chef_specs, chef_usernames, order_stats, transaction_stats, today, now):
        month_field_map = {
            1: "sales_january",
            2: "sales_february",
            3: "sales_march",
            4: "sales_april",
            5: "sales_may",
            6: "sales_june",
            7: "sales_july",
            8: "sales_august",
            9: "sales_september",
            10: "sales_october",
            11: "sales_november",
            12: "sales_december",
        }

        spec_by_username = {item["username"]: item for item in chef_specs}

        for chef_username in chef_usernames:
            chef = Chef.objects.filter(chef_username=chef_username).first()
            if not chef:
                continue

            month_revenue = order_stats["chef_revenue_by_month"].get(chef_username, {})
            current_month = today.month
            previous_month = 12 if current_month == 1 else current_month - 1

            for month, field_name in month_field_map.items():
                setattr(chef, field_name, round(float(month_revenue.get(month, 0.0)), 2))

            total_campaigns = Campaign.objects.filter(chef=chef_username).count()
            total_orders_received = int(order_stats["chef_order_counts"].get(chef_username, 0))
            total_deposit = round(float(transaction_stats["deposit_by_chef"].get(chef_username, 0.0)), 2)
            this_month_sales = round(float(month_revenue.get(current_month, 0.0)), 2)
            last_month_sales = round(float(month_revenue.get(previous_month, 0.0)), 2)

            chef.total_campaigns = total_campaigns
            chef.total_orders_received = total_orders_received
            chef.total_deposit = int(total_deposit)
            chef.this_month_sales = this_month_sales
            chef.last_month_sales = last_month_sales
            chef.balance = round(max((total_deposit * 0.35) + (this_month_sales * 0.4), 120.0), 2)
            chef.campaign_points = (total_campaigns * 18) + (total_orders_received * 3)

            spec = spec_by_username.get(chef_username)
            if spec:
                sub_status = str(spec.get("subscription_status", "Expired"))
                chef.subscription_status = sub_status
                if sub_status.lower() == "active":
                    chef.subscription_ends = now + timedelta(days=60)
                else:
                    chef.subscription_ends = now - timedelta(days=15)

            chef.save()

    def _update_user_profiles(self, *, user_usernames, order_stats):
        for idx, username in enumerate(user_usernames, start=1):
            user = User.objects.filter(username=username).first()
            if not user:
                continue
            profile = Profile.objects.filter(user=user).first()
            if not profile:
                continue

            profile.role = "user"
            profile.aiu_id = profile.aiu_id or f"AIU{7000 + idx}"
            profile.room_number = profile.room_number or f"E-{idx:03d}"
            profile.total_orders = int(order_stats["user_order_counts"].get(username, 0))
            profile.last_order = order_stats["user_last_order_at"].get(username)
            profile.save()

    def _seed_auxiliary_records(self, *, now, user_usernames, chef_usernames, rng, today):
        plans = [
            ("Basic Student Plan", 1, 29.0, "Best for new chefs starting in campus."),
            ("Growth Plan", 3, 79.0, "For active chefs with frequent campaigns."),
            ("Pro Kitchen Plan", 6, 149.0, "For high-volume chefs and premium listings."),
        ]
        for name, months, price, description in plans:
            Subscription_option.objects.update_or_create(
                name=name,
                defaults={
                    "duration_months": months,
                    "price": price,
                    "description": f"{DEMO_TAG} {description}",
                },
            )

        Setting.objects.update_or_create(
            setting_name="site_currency",
            defaults={"setting_value": "MYR"},
        )
        Setting.objects.update_or_create(
            setting_name="demo_seeded_at",
            defaults={"setting_value": now.isoformat()},
        )

        Dashboard_report_schedule.objects.update_or_create(
            email="demo_reports@foodnow.local",
            defaults={
                "frequency": Dashboard_report_schedule.FREQUENCY_WEEKLY,
                "is_active": True,
                "next_run_at": now + timedelta(days=7),
            },
        )

        User_feedback.objects.filter(
            Q(user__in=user_usernames) | Q(user__in=chef_usernames)
        ).delete()

        feedback_count = 0
        categories = [User_feedback.CATEGORY_SUPPORT, User_feedback.CATEGORY_FEEDBACK]
        priorities = [
            User_feedback.PRIORITY_LOW,
            User_feedback.PRIORITY_NORMAL,
            User_feedback.PRIORITY_HIGH,
        ]
        statuses = [
            User_feedback.STATUS_OPEN,
            User_feedback.STATUS_IN_REVIEW,
            User_feedback.STATUS_RESOLVED,
        ]
        subject_map = {
            User_feedback.CATEGORY_SUPPORT: [
                "Need help with order status",
                "Unable to update profile details",
                "Issue with payment confirmation",
                "Campaign delivery timing question",
            ],
            User_feedback.CATEGORY_FEEDBACK: [
                "Feature suggestion for dashboard",
                "Great experience with new UI",
                "Request for improved notifications",
                "Feedback about campaign filters",
            ],
        }

        all_demo_users = list(user_usernames) + list(chef_usernames)
        for day_offset in range(0, 45, 2):
            day = today - timedelta(days=day_offset)
            entries = rng.randint(1, 3)
            for _ in range(entries):
                username = rng.choice(all_demo_users)
                user = User.objects.filter(username=username).first()
                category = rng.choice(categories)
                subject = rng.choice(subject_map[category])
                status_value = rng.choices(statuses, weights=[4, 2, 3], k=1)[0]
                priority = rng.choices(priorities, weights=[2, 5, 3], k=1)[0]
                rating = None
                if category == User_feedback.CATEGORY_FEEDBACK:
                    rating = rng.randint(3, 5)

                item = User_feedback.objects.create(
                    user=username,
                    email=(user.email if user else None),
                    category=category,
                    subject=f"{DEMO_TAG} {subject}",
                    message=f"{DEMO_TAG} Seeded {category} message for UI testing.",
                    rating=rating,
                    priority=priority,
                    status=status_value,
                    admin_notes=(
                        f"{DEMO_TAG} Resolved by support team."
                        if status_value == User_feedback.STATUS_RESOLVED
                        else ""
                    ),
                )
                created_at = _aware_datetime(
                    day,
                    hour=rng.randint(9, 22),
                    minute=rng.choice([0, 10, 20, 30, 40, 50]),
                )
                updated_at = created_at + timedelta(hours=rng.randint(1, 36))
                User_feedback.objects.filter(pk=item.pk).update(created_at=created_at, updated_at=updated_at)
                feedback_count += 1

        return {"feedback_count": feedback_count}
