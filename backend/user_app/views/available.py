from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from django.utils import timezone
from admin_app.serializers import FoodSerializer
from admin_app.models import Profile
from user_app.models import Campaign, Food



# Create your views here.

class available(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if not user.is_authenticated:
            return Response({'message': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)

        profile = Profile.objects.filter(user=user).first()
        if not profile:
            return Response({'message': 'Profile not found'}, status=status.HTTP_404_NOT_FOUND)

        role = profile.role
        if role not in ['user', 'chef', 'admin']:
            return Response({
                'message': 'You are not authorized to access this page'
            }, status=status.HTTP_403_FORBIDDEN)

        now = timezone.now()
        available_campaigns = Campaign.objects.filter(
            Q(status='running') & Q(start_time__lte=now) & (Q(end_time__isnull=True) | Q(end_time__gte=now))
        ).order_by('-start_time')

        campaigns_data = []
        for campaign in available_campaigns:
            food_map = campaign.food_items or {}
            food_items_list = []
            for fid, quantity in food_map.items():
                food = Food.objects.filter(pk=fid).first()
                if not food:
                    continue
                food_data = FoodSerializer(food).data
                food_data['campaign_quantity'] = quantity
                food_items_list.append(food_data)

            campaigns_data.append({
                'id': str(campaign.uid),
                'title': campaign.title,
                'description': campaign.campaign_description,
                'chef': campaign.chef,
                'start_time': campaign.start_time,
                'end_time': campaign.end_time,
                'delivery_time': campaign.delivery_time,
                'quantity_available': campaign.quantity_available,
                'food_items': food_items_list,
            })

        return Response({
            'campaigns': campaigns_data,
            'status': status.HTTP_200_OK,
        })
