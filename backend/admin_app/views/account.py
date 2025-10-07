from rest_framework import generics 
from rest_framework.response import Response
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken, AccessToken
from django.contrib.auth.models import User 
from admin_app.serializers import *
from rest_framework import status


class register(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer


class login(generics.GenericAPIView):
    serializer_class = LoginSerializer

    # POST request to login
    def post(self, request, *args, **kwargs):
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(username = username, password = password)
        if user is not None:
            refresh = RefreshToken.for_user(user)
            user_serializer = UserSerializer(user)
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user' : user_serializer.data,
            })
        else:
            return Response({ 'detail': 'Invalid credentials'}, status=401)
