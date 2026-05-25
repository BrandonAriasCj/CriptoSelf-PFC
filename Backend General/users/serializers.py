from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import UserProfile, CompanyProfile

User = get_user_model()


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = [
            'company', 'job_title', 'website', 'linkedin_url', 'github_url', 
            'twitter_url', 'preferred_currency', 'risk_tolerance',
            'email_notifications', 'sms_notifications', 'push_notifications'
        ]


class CompanyProfileSerializer(serializers.ModelSerializer):
    """Serializer de solo lectura para datos del perfil empresarial"""
    display_name = serializers.ReadOnlyField()

    class Meta:
        model = CompanyProfile
        fields = [
            'company_name', 'tax_id', 'industry', 'company_size',
            'company_website', 'company_logo', 'company_address',
            'company_country', 'company_city',
            'notify_reports', 'notify_students',
            'display_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class CompanyProfileUpdateSerializer(serializers.ModelSerializer):
    """Serializer de escritura para actualizar datos del perfil empresarial"""

    class Meta:
        model = CompanyProfile
        fields = [
            'company_name', 'tax_id', 'industry', 'company_size',
            'company_website', 'company_logo', 'company_address',
            'company_country', 'company_city',
            'notify_reports', 'notify_students'
        ]


class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)
    company_profile = CompanyProfileSerializer(read_only=True)
    full_name = serializers.ReadOnlyField()
    display_name = serializers.ReadOnlyField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'full_name',
            'display_name', 'phone_number', 'date_of_birth', 'avatar', 'bio',
            'is_verified', 'email_verified', 'phone_verified', 'is_public_profile',
            'allow_notifications', 'profile_type', 'date_joined',
            'profile', 'company_profile'
        ]
        read_only_fields = [
            'id', 'is_verified', 'email_verified', 'phone_verified', 'date_joined'
        ]


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = [
            'username', 'email', 'password', 'password_confirm',
            'first_name', 'last_name', 'phone_number'
        ]
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Las contraseñas no coinciden")
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(required=False)

    class Meta:
        model = User
        fields = [
            'first_name', 'last_name', 'phone_number', 'date_of_birth',
            'avatar', 'bio', 'is_public_profile', 'allow_notifications', 'profile'
        ]

    def update(self, instance, validated_data):
        profile_data = validated_data.pop('profile', None)

        # Actualizar usuario
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Actualizar perfil si existe
        if profile_data:
            profile, _ = UserProfile.objects.get_or_create(user=instance)
            for attr, value in profile_data.items():
                setattr(profile, attr, value)
            profile.save()

        return instance


class CompanyUserUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer para actualizar el usuario + perfil de empresa en un solo request.
    Usado por CompanyProfileView (PUT/PATCH).
    """
    company_profile = CompanyProfileUpdateSerializer(required=False)

    class Meta:
        model = User
        fields = [
            'first_name', 'last_name', 'phone_number',
            'avatar', 'is_public_profile', 'allow_notifications',
            'company_profile'
        ]

    def update(self, instance, validated_data):
        company_data = validated_data.pop('company_profile', None)

        # Actualizar campos del usuario
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Actualizar / crear perfil de empresa
        if company_data:
            cp, _ = CompanyProfile.objects.get_or_create(user=instance)
            for attr, value in company_data.items():
                setattr(cp, attr, value)
            cp.save()

        return instance


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=8)
    new_password_confirm = serializers.CharField(required=True)
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError("Las nuevas contraseñas no coinciden")
        return attrs