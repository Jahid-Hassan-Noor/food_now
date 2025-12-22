from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from admin_app.models import Setting
from admin_app.serializers import SettingSerializer

class UserSettings(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request):
		# Example: return all settings (customize as needed)
		settings = Setting.objects.all()
		settings_data = SettingSerializer(settings, many=True).data
		return Response({
			'settings': settings_data,
			'status': status.HTTP_200_OK,
		})
