from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth.models import User
from admin_app.models import Profile, Pending_transaction, Transaction_history
from user_app.models import Chef, Campaign, Order

class AdminDashboard(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request):
		user_count = User.objects.count()
		chef_count = Chef.objects.count()
		campaign_count = Campaign.objects.count()
		order_count = Order.objects.count()
		pending_transactions = Pending_transaction.objects.count()
		completed_transactions = Transaction_history.objects.count()
		return Response({
			'user_count': user_count,
			'chef_count': chef_count,
			'campaign_count': campaign_count,
			'order_count': order_count,
			'pending_transactions': pending_transactions,
			'completed_transactions': completed_transactions,
			'status': status.HTTP_200_OK,
		})
