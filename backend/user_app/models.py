# user_app/models.py


from django.db import models
from core.models import core_model


# Create your models here.


class Campaign(core_model):
    chef = models.CharField(max_length=100, default="Chef Username")
    status = models.CharField(max_length=100, default="running")
    food_status = models.CharField(max_length=100, default="cooking")
    title = models.CharField(max_length=100, default="Campaign Title")
    campaign_description = models.TextField(blank=True, null=True)
    food_items = models.JSONField(default=dict, blank=True, null=True)
    start_time = models.DateTimeField(auto_now_add=True, null=True, blank=True, editable=True)
    end_time = models.DateTimeField(auto_now_add=True, null=True, blank=True, editable=True)
    delivery_time = models.DateTimeField(auto_now_add=True, null=True, blank=True, editable=True)
    quantity_available = models.IntegerField(default=0)
    total_orders = models.IntegerField(default=0)

    def __str__(self):
        return self.title


class Campaign_history(core_model):
    chef = models.CharField(max_length=100, default="Chef Username")
    status = models.CharField(max_length=100, default="active")
    title = models.CharField(max_length=100, default="Campaign Title")
    campaign_description = models.TextField(blank=True, null=True)
    food_ids = models.TextField(blank=True, null=True, default="Food IDs(comma separated)")
    start_time = models.DateTimeField(auto_now_add=True, null=True, blank=True, editable=True)
    end_time = models.DateTimeField(auto_now_add=True, null=True, blank=True, editable=True)
    delivery_time = models.DateTimeField(auto_now_add=True, null=True, blank=True, editable=True)
    total_orders = models.IntegerField(default=0)

    def __str__(self):
        return self.title


class Chef(core_model):
    chef_username = models.CharField(max_length=100, default="Chef Name")
    chef_description = models.TextField(blank=True, null=True)
    chef_image = models.ImageField(upload_to='chef_images/', default='chef_images/default.png')
    balance = models.FloatField(default=0.0)
    total_orders_received = models.IntegerField(default=0 , blank=True, null=True)
    total_deposit = models.IntegerField(default=0)
    total_campaigns = models.IntegerField(default=0 , blank=True, null=True)
    subscription_status = models.CharField(max_length=50, default="Expired")
    subscription_ends = models.DateTimeField(auto_now_add=True, null=True, blank=True, editable=True)
    campaign_points = models.IntegerField(default=0, blank=True, null=True)
    last_month_sales = models.FloatField(default=0.0, blank=True, null=True)
    this_month_sales = models.FloatField(default=0.0, blank=True, null=True)
    sales_january = models.FloatField(default=0.0, blank=True, null=True)
    sales_february = models.FloatField(default=0.0, blank=True, null=True)
    sales_march = models.FloatField(default=0.0, blank=True, null=True)
    sales_april = models.FloatField(default=0.0, blank=True, null=True)
    sales_may = models.FloatField(default=0.0, blank=True, null=True)
    sales_june = models.FloatField(default=0.0, blank=True, null=True)
    sales_july = models.FloatField(default=0.0, blank=True, null=True)
    sales_august = models.FloatField(default=0.0, blank=True, null=True)
    sales_september = models.FloatField(default=0.0, blank=True, null=True)
    sales_october = models.FloatField(default=0.0, blank=True, null=True)
    sales_november = models.FloatField(default=0.0, blank=True, null=True)
    sales_december = models.FloatField(default=0.0, blank=True, null=True)

    def __str__(self):
        return self.chef_username



class Food(core_model):
    food_name = models.CharField(max_length=100, default="Food Name")
    food_description = models.TextField(blank=True, null=True)
    chef = models.CharField(max_length=100, default="Chef Name")
    food_price = models.FloatField(default=0)
    food_image = models.ImageField(upload_to='food_images/', default='food_images/default.png')

    def __str__(self):
        return self.food_name
    

class Order(core_model):
    user = models.CharField(max_length=100)
    user_address = models.CharField(max_length=255, default="User Address")
    user_phone = models.CharField(max_length=15, default="User Phone")
    quantity = models.IntegerField(default=0)
    food_items = models.TextField(blank=True, null=True)
    food_price = models.FloatField(default=0)
    order_time = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.uid}"
    


class Order_history(core_model):
    user = models.CharField(max_length=100)
    quantity = models.IntegerField(default=0)
    food_items = models.TextField(blank=True, null=True)
    food_price = models.FloatField(default=0)
    order_id = models.CharField(max_length=200, null = True, blank = True)
    order_time = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.order_id