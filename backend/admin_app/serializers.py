from rest_framework import serializers
from django.contrib.auth.models import User
from home_app.models import *
from user_app.models import *
from admin_app.models import *

class UserSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'date_joined', 'role')


    def get_role(self, obj):
        try:
            profile = Profile.objects.get(user=obj)
            return profile.role
        except Profile.DoesNotExist:
            return "user"


class RegisterSerializer (serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('username', 'email', 'first_name', 'last_name', 'password')
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        return User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(required=True)
    password = serializers.CharField(required=True, write_only=True)


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        # fields = ('uid', 'user', 'date_of_birth', 'country', 'blood_type', 'gender', 'address', 'phone', 'role', 'password_reset_token', 'updated_at')
        fields = '__all__'


class ChefSerializer(serializers.ModelSerializer):
    class Meta:
        model = Chef
        # fields = ('uid', 'profile', 'teacher_id', 'school', 'designation', 'qualifications', 'bio', 'contact_email', 'profile_picture', 'full_name',)
        fields = '__all__'

