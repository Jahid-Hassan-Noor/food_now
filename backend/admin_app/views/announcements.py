from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from notifications.models import Announcement
from admin_app.serializers import AnnouncementSerializer

class Announcements(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request):
		announcements = Announcement.objects.all().order_by('-time')
		serializer = AnnouncementSerializer(announcements, many=True)
		return Response({
			'announcements': serializer.data,
			'status': status.HTTP_200_OK,
		})
