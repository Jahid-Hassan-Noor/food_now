from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from admin_app.models import Setting
from admin_app.serializers import SettingSerializer

class AppSettings(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request):
		settings = Setting.objects.all()
		serializer = SettingSerializer(settings, many=True)
		return Response({
			'settings': serializer.data,
			'status': status.HTTP_200_OK,
		})
