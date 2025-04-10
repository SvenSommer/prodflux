from rest_framework import serializers
from .models import User
from .models import Workshop

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'workshop']

class WorkshopSerializer(serializers.ModelSerializer):
    class Meta:
        model = Workshop
        fields = ['id', 'name']