# user_app/urls.py


from django.urls import path
from user_app.views import *


urlpatterns = [
path('available/', available.as_view()),
path('chef_dashboard/', chef_dashboard.as_view()),
path('campaign/', campaign.as_view()),
path('orders/', orders.as_view()),
path('order_details/', order_details.as_view()),
path('profile/', profile.as_view()),
path('subscription/', subscription.as_view()),
path('settings/', settings.as_view()),
path('top_up/', top_up.as_view()),
path('user_deshboard/', user_deshboard.as_view()),
path('your_orders/', your_orders.as_view()),
]
