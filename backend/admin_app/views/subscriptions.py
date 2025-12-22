
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework import generics
from admin_app.models import Subscription_option
from admin_app.serializers import ChefSerializer
from admin_app.serializers import SubscriptionOptionSerializer
from user_app.models import Chef
from django.contrib.auth.models import User

# List and create subscription options (admin only)
class SubscriptionOptionListCreate(generics.ListCreateAPIView):
	queryset = Subscription_option.objects.all()
	serializer_class = SubscriptionOptionSerializer
	permission_classes = [IsAuthenticated]

	def post(self, request, *args, **kwargs):
		# Only admin can create
		if not request.user.is_superuser:
			return Response({'detail': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
		return super().post(request, *args, **kwargs)

# Retrieve, update, delete a subscription option (admin only)
class SubscriptionOptionDetail(generics.RetrieveUpdateDestroyAPIView):
	queryset = Subscription_option.objects.all()
	serializer_class = SubscriptionOptionSerializer
	permission_classes = [IsAuthenticated]

	def put(self, request, *args, **kwargs):
		if not request.user.is_superuser:
			return Response({'detail': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
		return super().put(request, *args, **kwargs)

	def delete(self, request, *args, **kwargs):
		if not request.user.is_superuser:
			return Response({'detail': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
		return super().delete(request, *args, **kwargs)

# List available subscription options for chefs (all authenticated users)
class AvailableSubscriptions(APIView):
	permission_classes = [IsAuthenticated]
	def get(self, request):
		options = Subscription_option.objects.all()
		serializer = SubscriptionOptionSerializer(options, many=True)
		return Response({'available_subscriptions': serializer.data, 'status': status.HTTP_200_OK})
