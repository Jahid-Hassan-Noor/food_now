from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from user_app.models import Order, Food
from admin_app.serializers import OrderSerializer, FoodSerializer

class OrderDetails(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request, order_id):
		try:
			order = Order.objects.get(pk=order_id)
		except Order.DoesNotExist:
			return Response({'message': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)

		order_data = OrderSerializer(order).data

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

		return Response({
			'order': order_data,
			'status': status.HTTP_200_OK,
		})
