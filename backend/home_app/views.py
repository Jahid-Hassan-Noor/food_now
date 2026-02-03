# home_app/views.py


from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from user_app.models import Campaign, Food, Chef, Order
from admin_app.models import Profile
from django.contrib.auth.models import User
from admin_app.serializers import CampaignSerializer, FoodSerializer, ChefSerializer
from django.utils import timezone

class home(APIView):
    def get(self, request):
        now = timezone.now()
        # Running campaigns
        running_campaigns = Campaign.objects.filter(status="running", start_time__lte=now, end_time__gte=now, quantity_available__gte=1).order_by('-start_time')
        campaigns_data = []
        for campaign in running_campaigns:
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
            campaigns_data.append({
                'id': str(campaign.uid),
                'title': campaign.title,
                'description': campaign.campaign_description,
                'chef': campaign.chef,
                'start_time': campaign.start_time,
                'end_time': campaign.end_time,
                'delivery_time': campaign.delivery_time,
                'food_items': food_items,
            })

        # Featured/Popular food items (by order count)
        food_order_counts = {}
        for order in Order.objects.all():
            if order.food_items:
                food_ids = [fid.strip() for fid in order.food_items.split(',') if fid.strip()]
                for fid in food_ids:
                    food_order_counts[fid] = food_order_counts.get(fid, 0) + order.quantity
        popular_food_ids = sorted(food_order_counts, key=food_order_counts.get, reverse=True)[:5]
        popular_foods = [FoodSerializer(Food.objects.get(pk=fid)).data for fid in popular_food_ids if Food.objects.filter(pk=fid).exists()]

        # Top chefs (by total_campaigns and sales)
        top_chefs = Chef.objects.order_by('-total_campaigns', '-this_month_sales')[:5]
        top_chefs_data = ChefSerializer(top_chefs, many=True).data

        # Statistics
        stats = {
            'total_campaigns_running': running_campaigns.count(),
            'total_food_items_available': Food.objects.count(),
            'total_users': User.objects.count(),
            'total_chefs': Chef.objects.count(),
        }

        return Response({
            'campaigns': campaigns_data,
            'featured_foods': popular_foods,
            'top_chefs': top_chefs_data,
            'statistics': stats,
            'status': status.HTTP_200_OK,
        })


