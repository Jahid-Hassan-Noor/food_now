from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth.models import User
from admin_app.models import Profile
from admin_app.serializers import UserSerializer, ProfileSerializer

class UsersList(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request):
		users = User.objects.all()
		users_serializer = UserSerializer(users, many=True)
		profiles = Profile.objects.all()
		profiles_serializer = ProfileSerializer(profiles, many=True)
		return Response({
			'users': users_serializer.data,
			'profiles': profiles_serializer.data,
			'status': status.HTTP_200_OK,
		})
