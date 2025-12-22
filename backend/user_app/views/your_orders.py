from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from user_app.models import Order_history, Food
from admin_app.serializers import Order_historySerializer, FoodSerializer

class UserOrderHistory(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request):
		user = request.user
		orders = Order_history.objects.filter(user=user.username).order_by('-order_time')
		orders_data = []
		for order in orders:
			order_data = Order_historySerializer(order).data
			# Parse food_items (assuming comma-separated food IDs)
			food_items = []
			if order.food_items:
				food_ids = [fid.strip() for fid in order.food_items.split(',') if fid.strip()]
				for fid in food_ids:
					try:
						food = Food.objects.get(pk=fid)
						food_data = FoodSerializer(food).data
						food_items.append(food_data)
					except Food.DoesNotExist:
						continue
			order_data['food_items_details'] = food_items
			orders_data.append(order_data)

		return Response({
			'order_history': orders_data,
			'status': status.HTTP_200_OK,
		})
