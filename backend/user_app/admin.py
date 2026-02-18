# user_app/admin.py


from django.contrib import admin
from user_app.models import *

class ChefAdmin(admin.ModelAdmin):
    readonly_fields = ('uid', )

class CampaignAdmin(admin.ModelAdmin):
    readonly_fields = ('uid', )

class Campaign_historyAdmin(admin.ModelAdmin):
    readonly_fields = ('uid', )

class OrderAdmin(admin.ModelAdmin):
    readonly_fields = ('order_time', 'uid', )

class Order_historyAdmin(admin.ModelAdmin):
    readonly_fields = ('order_time', )




# Register your models here.
admin.site.register(Food),
admin.site.register(Chef, ChefAdmin),
admin.site.register(Campaign, CampaignAdmin),
admin.site.register(Campaign_history, Campaign_historyAdmin),
admin.site.register(Order, OrderAdmin),
admin.site.register(Order_history, Order_historyAdmin),
