# from django.shortcuts import render
# from django.contrib.auth.decorators import login_required
# from home_app.models import Profile
# # from user_app.views.views_common_functions import convert_userdata_in_MK


# @login_required(login_url='login')
# def dashboard(request):
#     profile = Profile.objects.get(user = request.user)

#     # Getting User data from database
#     total_orders = profile.total_orders
#     pending_orders = profile.total_orders



    

#     # Sending user data by context  
#     context = { 
#                 'total_orders' : total_orders,
#                 'pending_orders' : pending_orders,
#                }

#     return render(request , "user/dashboard.html" , context)



from django.contrib.auth.models import User
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from admin_app.serializers import UserSerializer
from admin_app.models import Profile

# Create your views here.

class user_dashboad(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        user = request.user
        profile = Profile.objects.get(user=user)
        user_serializer = UserSerializer(user)
        role = profile.role

        if role != 'admin':
            return Response({
                'message': 'You are not authorized to access this page'
            }, status=status.HTTP_403_FORBIDDEN)

            # Get all users
        all_users = User.objects.all()
        all_users_serializer = UserSerializer(all_users, many=True)

        return Response({
            'message': 'Welcome to dashboard',
            'user' : user_serializer.data,
            'all_users' : all_users_serializer.data,
        }, status=status.HTTP_200_OK)