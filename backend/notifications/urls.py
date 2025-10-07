# notifications/urls.py

from django.urls import path
from notifications.views import *


urlpatterns = [
    path('send_notification_to_all', send_notification_to_all , name='send_notification_to_all'),
    path('send_notification_to_chefs', send_notification_to_chefs , name='send_notification_to_chefs'),
    path('send_notification_to_user', send_notification_to_user , name='send_notification_to_user'),
]