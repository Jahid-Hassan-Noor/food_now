from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from admin_app.models import Profile
from admin_app.serializers import ProfileSerializer

class UserProfile(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request):
		user = request.user
		try:
			profile = Profile.objects.get(user=user)
		except Profile.DoesNotExist:
			return Response({'message': 'Profile not found'}, status=status.HTTP_404_NOT_FOUND)
		profile_data = ProfileSerializer(profile).data
		return Response({
			'profile': profile_data,
			'status': status.HTTP_200_OK,
		})
