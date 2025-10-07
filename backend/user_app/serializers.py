from rest_framework import serializers
from django.contrib.auth.models import User
from home_app.models import *
from user_app.models import *
from admin_app.models import *


class ChefSerializer(serializers.ModelSerializer):
    class Meta:
        model = Chef
        # fields = ('uid', 'profile', 'teacher_id', 'school', 'designation', 'qualifications', 'bio', 'contact_email', 'profile_picture', 'full_name',)
        fields = '__all__'

