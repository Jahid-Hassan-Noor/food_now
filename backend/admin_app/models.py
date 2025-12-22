# backend/admin_app/models.py

from django.db import models
from core.models import core_model
from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
import uuid
from core.emails import *
from django.utils.timezone import now



class Profile(core_model):
    user = models.OneToOneField(User, on_delete=models.CASCADE , related_name="profile")
    role = models.CharField( max_length=100 , default="user" )
    aiu_id = models.CharField( max_length=100 , null=True , blank=True )
    id_card = models.ImageField(upload_to ='id_card/', null=True, blank=True)
    total_orders = models.IntegerField(default=0 , blank=True, null=True)
    room_number = models.CharField( max_length=100 , null=True , blank=True )
    is_account_banned = models.BooleanField(default=False)
    password_reset_token = models.CharField(max_length=100 , null=True , blank=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True )
    updated_at = models.DateTimeField(default=now, editable=True)
    last_order = models.DateTimeField(editable=True, null=True, blank=True)
    

    def __str__(self):
        return self.user.username


@receiver( post_save, sender = User)
def create_profile( sender, instance , created , **kwargs):
    try:
        if created:
            Profile.objects.create(
                user=instance,
            )
    except Exception as e:
        print(e)


class Pending_transaction(core_model):
    status = models.CharField(max_length=100, default="active")
    chef = models.CharField(max_length=100, default="chef username")
    type = models.CharField(max_length=100, default="Transaction Type")
    transaction_description = models.TextField(blank=True, null=True)
    transaction_proof = models.ImageField(upload_to='transaction_proofs/')
    transaction_time = models.DateTimeField(auto_now_add=True, null=True, blank=True, editable=True)
    amount = models.FloatField(null=True, blank=True, default=0.0)

    def __str__(self):
        return self.chef


class Transaction_history(core_model):
    status = models.CharField(max_length=100, default="active")
    chef = models.CharField(max_length=100, default="chef username")
    type = models.CharField(max_length=100, default="Transaction Type")
    transaction_description = models.TextField(blank=True, null=True)
    transaction_proof = models.ImageField(upload_to='transaction_proofs/')
    transaction_id = models.TextField(blank=True, null=True, default="Transaction UID")
    transaction_time = models.DateTimeField(auto_now_add=True, null=True, blank=True, editable=True)
    amount = models.FloatField(null=True, blank=True, default=0.0)

    def __str__(self):
        return self.transaction_id
    


class Setting(models.Model):
    setting_name = models.CharField( max_length=100 , null=True , blank=True, default= "setting name")
    setting_value = models.TextField( null=True , blank=True, default= "setting value" )


    def __str__(self):
        return self.setting_name


class Subscription_option(models.Model):
    name = models.CharField(max_length=100)
    duration_months = models.PositiveIntegerField()
    price = models.FloatField()
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.duration_months} months)"