# user_app/urls.py


from django.urls import path
from user_app.views import * 


urlpatterns = [
	path('available/', available.as_view()),
	path('chef_dashboard/', chef_dashboard.as_view()),
	path('campaign/current/', CampaignCurrent.as_view()),
	path('campaign/current/<str:campaign_id>/', CampaignCurrentAction.as_view()),
	path('campaign/create/', CampaignCreate.as_view()),
	path('campaign/history/', CampaignHistory.as_view()),
	path('food_inventory/listed/', FoodInventoryListed.as_view()),
	path('food_inventory/add/', FoodInventoryCreate.as_view()),
	path('food_inventory/item/<str:food_id>/', FoodInventoryItem.as_view()),
	path('campaign/<str:campaign_id>/', CampaignDetails.as_view()),
	path('campaign_orders/pending/', CampaignOrdersPending.as_view()),
	path('campaign_orders/pending/<str:order_id>/', CampaignOrdersPendingAction.as_view()),
	path('campaign_orders/history/', CampaignOrdersHistory.as_view()),
	path('orders/', UserOrders.as_view()),
	path('order_details/<str:order_id>/', OrderDetails.as_view()),
	path('profile/', UserProfile.as_view()),
	path('subscription/', SubscriptionStatus.as_view()),
	path('subscription/options/', SubscriptionOptions.as_view()),
	path('subscription/pending/', SubscriptionPending.as_view()),
	path('subscription/history/', SubscriptionHistory.as_view()),
	path('subscription/request/', SubscriptionRequest.as_view()),
	path('settings/', UserSettings.as_view()),
	path('top_up/', TopUpHistory.as_view()),
	path('support/', SupportRequests.as_view()),
	path('feedback/', FeedbackRequests.as_view()),
	path('user_dashboard/', user_dashboad.as_view()),
	path('your_orders/', UserOrderHistory.as_view()),
]
