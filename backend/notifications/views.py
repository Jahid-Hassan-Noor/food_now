# notifications/views.py

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth.models import User
from admin_app.models import Profile
from notifications.models import Notification


# Create your views here.
class SendNotificationToAll(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        title = request.data.get('title')
        message = request.data.get('message')

        if not title or not message:
            return Response({
                'status': status.HTTP_400_BAD_REQUEST,
                'message': 'Title and message are required.'
            }, status=status.HTTP_400_BAD_REQUEST)

        all_users = User.objects.all()
        
        for user in all_users:
            username = user.username
            # Create new notification
            Notification.objects.create(
                sender="Admin",
                username=username,
                title=title,
                message=message,
            )

        return Response({
            'status': status.HTTP_200_OK,
            'message': 'Notifications sent successfully.'
        }, status=status.HTTP_200_OK)


class SendNotificationToChefs(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        title = request.data.get('title')
        message = request.data.get('message')

        if not title or not message:
            return Response({
                'status': status.HTTP_400_BAD_REQUEST,
                'message': 'Title and message are required.'
            }, status=status.HTTP_400_BAD_REQUEST)

        all_chefs = Profile.objects.filter(role="Chef")
        
        if not all_chefs.exists():
            return Response({
                'status': status.HTTP_404_NOT_FOUND,
                'message': 'No chefs found.'
            }, status=status.HTTP_404_NOT_FOUND)

        try:
            for chef_profile in all_chefs:
                username = chef_profile.user.username
                # Create new notification
                Notification.objects.create(
                    sender="Admin",
                    username=username,
                    title=title,
                    message=message,
                )
        except Exception as e:
            return Response({
                'status': status.HTTP_500_INTERNAL_SERVER_ERROR,
                'message': f'Error: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({
            'status': status.HTTP_200_OK,
            'message': 'Notifications sent to chefs successfully.'
        }, status=status.HTTP_200_OK)


class SendNotificationToUser(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        username = request.data.get('username')
        title = request.data.get('title')
        message = request.data.get('message')

        if not username or not title or not message:
            return Response({
                'status': status.HTTP_400_BAD_REQUEST,
                'message': 'Username, title, and message are required.'
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({
                'status': status.HTTP_404_NOT_FOUND,
                'message': 'User not found.'
            }, status=status.HTTP_404_NOT_FOUND)

        # Create new notification
        Notification.objects.create(
            sender="Admin",
            username=username,
            title=title,
            message=message,
        )

        return Response({
            'status': status.HTTP_200_OK,
            'message': 'Notification sent successfully.'
        }, status=status.HTTP_200_OK)