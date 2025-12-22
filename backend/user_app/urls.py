# user_app/urls.py


from django.urls import path
from user_app.views import * 


urlpatterns = [
	path('available/', available.as_view()),
	path('chef_dashboard/', chef_dashboard.as_view()),
	path('campaign/<str:campaign_id>/', CampaignDetails.as_view()),
	path('orders/', UserOrders.as_view()),
	path('order_details/<str:order_id>/', OrderDetails.as_view()),
	path('profile/', UserProfile.as_view()),
	path('subscription/', SubscriptionStatus.as_view()),
	path('settings/', UserSettings.as_view()),
	path('top_up/', TopUpHistory.as_view()),
	path('user_dashboard/', user_dashboad.as_view()),
	path('your_orders/', UserOrderHistory.as_view()),
]
