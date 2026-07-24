"""
Serializers for City Care API.
"""

from rest_framework import serializers
from .models import User, Complaint


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model (SQLite)."""
    
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'role_display', 'first_name', 'last_name', 'phone']
        read_only_fields = ['id']


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=4, error_messages={'min_length': 'Password must be at least 4 characters.'})
    phone = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'role', 'first_name', 'last_name', 'phone']
        extra_kwargs = {
            'username': {'error_messages': {'required': 'Username is required.', 'unique': 'This username is already taken.'}},
        }
    
    def validate_username(self, value):
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError('This username is already taken.')
        return value
    
    def validate_phone(self, value):
        if value and not value.startswith('+'):
            raise serializers.ValidationError('Phone number must include country code (e.g., +91XXXXXXXXXX).')
        return value
    
    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class ComplaintSerializer(serializers.ModelSerializer):
    complainant_username = serializers.CharField(source='complainant.username', read_only=True)
    assigned_to_username = serializers.CharField(source='assigned_to.username', read_only=True)
    assigned_by_username = serializers.CharField(source='assigned_by.username', read_only=True)

    class Meta:
        model = Complaint
        fields = '__all__'


class ComplaintCreateSerializer(serializers.ModelSerializer):
    image_before = serializers.ImageField(required=False)
    location_coords = serializers.CharField(required=False, allow_blank=True)
    location_address = serializers.CharField(required=False, allow_blank=True)
    
    class Meta:
        model = Complaint
        fields = ['complainant_name', 'location_coords', 'location_address', 'image_before']


class AssignComplaintSerializer(serializers.Serializer):
    collector_id = serializers.IntegerField()


class PublicComplaintSerializer(serializers.ModelSerializer):
    """Public lookup serializer — no auth required, exposes only safe fields."""

    class Meta:
        model = Complaint
        fields = (
            'complaint_id', 'status', 'location_address',
            'image_before', 'image_after',
            'created_at', 'updated_at', 'urgency_level',
        )

