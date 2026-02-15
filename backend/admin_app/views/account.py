from rest_framework import generics 
from rest_framework.response import Response
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken, AccessToken
from django.contrib.auth.models import User 
from admin_app.serializers import *
from admin_app.models import Profile
from rest_framework import status
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.conf import settings
import os
import uuid
import logging
from core.emails import send_password_reset_email

logger = logging.getLogger(__name__)


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


class forgot_password(generics.GenericAPIView):
    serializer_class = ForgotPasswordSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"].strip().lower()
        email_sent = False
        debug_reason = "request accepted"

        # Avoid account-enumeration by always returning a success response.
        user = User.objects.filter(email__iexact=email).first()
        if user:
            profile = Profile.objects.filter(user=user).first()
            if profile:
                token = uuid.uuid4().hex
                profile.password_reset_token = token
                profile.save(update_fields=["password_reset_token"])

                frontend_base = os.getenv(
                    "FRONTEND_URL",
                    request.META.get("HTTP_ORIGIN", "http://localhost:3000"),
                ).rstrip("/")
                try:
                    send_password_reset_email(user.email, token, frontend_base)
                    email_sent = True
                except Exception as error:
                    debug_reason = f"email send failed: {type(error).__name__}: {error}"
                    logger.exception("Forgot password email send failed for %s", email)
            else:
                debug_reason = "profile not found for user"
        else:
            debug_reason = "user not found for this email"

        payload = {"detail": "If an account exists for this email, a reset link has been sent."}
        if settings.DEBUG:
            payload["debug"] = {
                "email_sent": email_sent,
                "reason": debug_reason,
            }

        return Response(payload, status=status.HTTP_200_OK)


class reset_password(generics.GenericAPIView):
    serializer_class = ResetPasswordSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        token = serializer.validated_data["token"].strip()
        password = serializer.validated_data["password"]

        profile = Profile.objects.filter(password_reset_token=token).first()
        if not profile:
            return Response(
                {"detail": "Invalid or expired reset token."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            validate_password(password, profile.user)
        except DjangoValidationError as error:
            return Response(
                {"detail": " ".join(error.messages)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = profile.user
        user.set_password(password)
        user.save()

        profile.password_reset_token = None
        profile.save(update_fields=["password_reset_token"])

        return Response(
            {"detail": "Password reset successful. You can now login with your new password."},
            status=status.HTTP_200_OK,
        )
