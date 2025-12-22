from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from user_app.models import Chef

class SubscriptionStatus(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request):
		user = request.user
		try:
			chef = Chef.objects.get(chef_username=user.username)
		except Chef.DoesNotExist:
			return Response({'message': 'Chef profile not found'}, status=status.HTTP_404_NOT_FOUND)
		return Response({
			'subscription_status': chef.subscription_status,
			'subscription_ends': chef.subscription_ends,
			'status': status.HTTP_200_OK,
		})
