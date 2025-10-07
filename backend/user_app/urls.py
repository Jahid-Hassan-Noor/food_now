# user_app/urls.py


from django.urls import path
from user_app.views import *


urlpatterns = [
path('chef_dashboard/', chef_dashboard.as_view()),
]
