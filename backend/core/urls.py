from django.contrib import admin
from django.urls import path, include
from django.conf import settings 
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenRefreshView, TokenObtainPairView
from admin_app.views import register, login, forgot_password, reset_password

urlpatterns = [
    path('super_admin/', admin.site.urls),
    path('auth/register/', register.as_view()),
    path('auth/login/', login.as_view()),
    path('auth/forgot-password/', forgot_password.as_view()),
    path('auth/reset-password/', reset_password.as_view()),
    path('auth/token/refresh/', TokenRefreshView.as_view()),
    path('admin/', include('admin_app.urls')),
    path('', include('home_app.urls')),
    path('', include('user_app.urls')),
    # path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
