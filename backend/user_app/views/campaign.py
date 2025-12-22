from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from user_app.models import Campaign, Food
from admin_app.serializers import CampaignSerializer, FoodSerializer

class CampaignDetails(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request, campaign_id):
		try:
			campaign = Campaign.objects.get(pk=campaign_id)
		except Campaign.DoesNotExist:
			return Response({'message': 'Campaign not found'}, status=status.HTTP_404_NOT_FOUND)
		campaign_data = CampaignSerializer(campaign).data
		food_items = []
		food_quantities = campaign.food_quantities or {}
		for fid, quantity in food_quantities.items():
			try:
				food = Food.objects.get(pk=fid)
				food_data = FoodSerializer(food).data
				food_data['campaign_quantity'] = quantity
				food_items.append(food_data)
			except Food.DoesNotExist:
				continue
		campaign_data['food_items'] = food_items
		return Response({
			'campaign': campaign_data,
			'status': status.HTTP_200_OK,
		})
