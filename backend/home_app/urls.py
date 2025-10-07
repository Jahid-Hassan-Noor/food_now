# home_app/urls.py 


from django.urls import path
from home_app.views import *

urlpatterns = [
    path('', home , name='home'),
    # path('password_reset', password_reset , name='password_reset'),
    # path('password_reset/<password_reset_token>', reset_your_password , name='reset_your_password'),
]
