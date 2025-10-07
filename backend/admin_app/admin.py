# admin_app/admin.py

from django.contrib import admin
from admin_app.models import *
from django.contrib.auth import get_user_model

# Register your models here.

User = get_user_model()

def has_superuser_permission(request):
    return request.user.is_active and request.user.is_superuser

# Only superuser can access root admin site (default)
admin.site.has_permission = has_superuser_permission

class SettingAdmin(admin.ModelAdmin):
    readonly_fields = ('id',)

class Pending_transactionAdmin(admin.ModelAdmin):
    readonly_fields = ('uid', 'transaction_time', )

class Transaction_historyAdmin(admin.ModelAdmin):
    readonly_fields = ('transaction_time', )


# Register your models here.
admin.site.register(Pending_transaction, Pending_transactionAdmin),
admin.site.register(Transaction_history, Transaction_historyAdmin),
admin.site.register(Profile)
admin.site.register(Setting, SettingAdmin)