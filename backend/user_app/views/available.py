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
        
        metrices = {
            'balance': chef.balance,
            'total_orders_received': chef.total_orders_received,
            'total_campaigns': chef.total_campaigns,
            'campaign_points': chef.campaign_points,
        }
        # all_chefs = Chef.objects.all()
        # paginator = PageNumberPagination()
        # paginated_chefs = paginator.paginate_queryset(all_chefs, request)
        # chef_serializer = ChefSerializer(paginated_chefs, many=True)

        return Response({
            'metrices': metrices,
            # 'chefs': chef_serializer.data,
            'status': status.HTTP_200_OK,})