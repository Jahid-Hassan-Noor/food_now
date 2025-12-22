from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from admin_app.serializers import UserSerializer, ChefSerializer, ProfileSerializer, CampaignSerializer
from admin_app.models import Profile
from user_app.models import Chef, Campaign
from rest_framework.pagination import PageNumberPagination



# Create your views here.

class available(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        user = request.user
        print(request.user)
        if not user.is_authenticated:
            return Response({'message': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        #     print("User is not authenticated")
        # print("User is authenticated")
        available_campaigns = Campaign.objects.filter(status='running')
        profile = Profile.objects.get(user=user)
        chef = Chef.objects.get(chef_username=user.username)
        user_serializer = UserSerializer(user)
        role = profile.role
        print("User role:", role)

        if role not in ['user', 'chef', 'admin']:
            return Response({
                'message': 'You are not authorized to access this page'
            }, status=status.HTTP_403_FORBIDDEN)

        # Prepare campaigns data with food items and their campaign-specific quantities
        from user_app.models import Food
        from admin_app.serializers import FoodSerializer
        campaigns_data = []
        for campaign in available_campaigns:
            food_items = campaign.food_items or {}
            food_items_list = []
            for fid, quantity in food_items.items():
                try:
                    food = Food.objects.get(pk=fid)
                    food_data = FoodSerializer(food).data
                    food_data['campaign_quantity'] = quantity
                    food_items.append(food_data)
                except Food.DoesNotExist:
                    continue
            campaigns_data.append({
                'id': str(campaign.uid),
                'title': campaign.title,
                'description': campaign.campaign_description,
                'chef': campaign.chef,
                'start_time': campaign.start_time,
                'end_time': campaign.end_time,
                'delivery_time': campaign.delivery_time,
                'quantity_available': campaign.quantity_available,
                'food_items': food_items,
            })

        return Response({
            'campaigns': campaigns_data,
            'status': status.HTTP_200_OK,
        })