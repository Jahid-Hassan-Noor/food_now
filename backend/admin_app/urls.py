# admin_app/urls.py


from django.urls import path
from admin_app.views import *


urlpatterns = [
	path('register/', register.as_view()),
	path('login/', login.as_view()),
	path('announcements/', Announcements.as_view()),
	path('settings/', AppSettings.as_view()),
	path('dashboard/', AdminDashboard.as_view()),
	path('subscriptions/', SubscriptionOptionListCreate.as_view()),
	path('subscriptions/<int:pk>/', SubscriptionOptionDetail.as_view()),
	path('available_subscriptions/', AvailableSubscriptions.as_view()),
	path('transactions/', Transactions.as_view()),
	path('users/', UsersList.as_view()),
	path('chefs/', Chefs.as_view()),
]