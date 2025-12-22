from rest_framework import serializers
from django.contrib.auth.models import User
from home_app.models import *
from user_app.models import *
from admin_app.models import *


class CampaignSerializer(serializers.ModelSerializer):
    class Meta:
        model = Campaign
        fields = '__all__'


class Campaign_historySerializer(serializers.ModelSerializer):
    class Meta:
        model = Campaign_history
        fields = '__all__'


class ChefSerializer(serializers.ModelSerializer):
    class Meta:
        model = Chef
        fields = '__all__'


class FoodSerializer(serializers.ModelSerializer):
    class Meta:
        model = Food
        fields = '__all__'


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(required=True)
    password = serializers.CharField(required=True, write_only=True)


class OrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = '__all__'


class Order_historySerializer(serializers.ModelSerializer):
    class Meta:
        model = Order_history
        fields = '__all__'


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        # fields = ('uid', 'user', 'date_of_birth', 'country', 'blood_type', 'gender', 'address', 'phone', 'role', 'password_reset_token', 'updated_at')
        fields = '__all__'


class Pending_transactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pending_transaction
        fields = '__all__'


class RegisterSerializer(serializers.ModelSerializer):
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


class SettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Setting
        fields = '__all__'


class Transaction_historySerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction_history
        fields = '__all__'


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
