from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from admin_app.models import Pending_transaction, Transaction_history
from admin_app.serializers import Pending_transactionSerializer, Transaction_historySerializer

class Transactions(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request):
		pending = Pending_transaction.objects.all()
		completed = Transaction_history.objects.all()
		pending_serializer = Pending_transactionSerializer(pending, many=True)
		completed_serializer = Transaction_historySerializer(completed, many=True)
		return Response({
			'pending_transactions': pending_serializer.data,
			'completed_transactions': completed_serializer.data,
			'status': status.HTTP_200_OK,
		})
