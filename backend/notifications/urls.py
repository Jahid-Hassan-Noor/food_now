# notifications/urls.py

from django.urls import path
from notifications.views import *


urlpatterns = [
    path('send_notification_to_all/', SendNotificationToAll.as_view()),
	path('send_notification_to_chefs/', SendNotificationToChefs.as_view()),
	path('send_notification_to_user/', SendNotificationToUser.as_view()),
]