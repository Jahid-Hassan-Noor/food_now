from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from admin_app.serializers import UserSerializer, ChefSerializer
from admin_app.models import Profile
from user_app.models import Chef
from faker import Faker
from rest_framework.pagination import PageNumberPagination


# Create your views here.

class Chefs(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        user = request.user
        profile = Profile.objects.get(user=user)
        user_serializer = UserSerializer(user)
        role = profile.role

        if role != 'admin':
            return Response({
                'message': 'You are not authorized to access this page'
            }, status=status.HTTP_403_FORBIDDEN)
        
        fake = Faker()
        existing_count = Chef.objects.count()
        required_chefs = 100


        if existing_count < required_chefs:
            chefs_to_create = []
            for _ in range(required_chefs - existing_count):
                first_name = fake.first_name()
                last_name = fake.last_name()
                full_name = f"{first_name} {last_name}"
                chef = Chef(
                    profile=first_name,
                    full_name=full_name,
                    chef_description=fake.text(max_nb_chars=200),
                    chef_image=None,
                )
                chefs_to_create.append(chef)

            # Bulk create chefs
            Chef.objects.bulk_create(chefs_to_create)

        all_chefs = Chef.objects.all()
        paginator = PageNumberPagination()
        paginated_chefs = paginator.paginate_queryset(all_chefs, request)
        chef_serializer = ChefSerializer(paginated_chefs, many=True)

        return paginator.get_paginated_response({
            'user': user_serializer.data,
            'chefs': chef_serializer.data,
            'status': status.HTTP_200_OK,})