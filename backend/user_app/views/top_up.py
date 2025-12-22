from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from user_app.models import Chef
from admin_app.models import Pending_transaction
from admin_app.serializers import Pending_transactionSerializer

class TopUpHistory(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request):
		user = request.user
		try:
			chef = Chef.objects.get(chef_username=user.username)
		except Chef.DoesNotExist:
			return Response({'message': 'Chef profile not found'}, status=status.HTTP_404_NOT_FOUND)
		transactions = Pending_transaction.objects.filter(chef=user.username)
		transactions_data = Pending_transactionSerializer(transactions, many=True).data
		return Response({
			'balance': chef.balance,
			'top_up_history': transactions_data,
			'status': status.HTTP_200_OK,
		})
