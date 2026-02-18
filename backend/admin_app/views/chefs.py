from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from admin_app.serializers import UserSerializer, ChefSerializer
from admin_app.models import Profile
from user_app.models import Chef
from rest_framework.pagination import PageNumberPagination


# Create your views here.

class Chefs(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        profile = Profile.objects.filter(user=user).first()
        if not profile:
            return Response({'message': 'Profile not found'}, status=status.HTTP_404_NOT_FOUND)

        if profile.role != 'admin':
            return Response({
                'message': 'You are not authorized to access this page'
            }, status=status.HTTP_403_FORBIDDEN)

        user_serializer = UserSerializer(user)
        all_chefs = Chef.objects.all().order_by('chef_username')
        paginator = PageNumberPagination()
        paginated_chefs = paginator.paginate_queryset(all_chefs, request)
        chef_serializer = ChefSerializer(paginated_chefs, many=True)

        return paginator.get_paginated_response({
            'user': user_serializer.data,
            'chefs': chef_serializer.data,
            'status': status.HTTP_200_OK,})
