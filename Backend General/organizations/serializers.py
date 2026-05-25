from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Organization, OrganizationAdmin, OrganizationInvitation

User = get_user_model()


class OrganizationSerializer(serializers.ModelSerializer):
    """Serializer para organizaciones"""
    current_students_count = serializers.ReadOnlyField()
    current_instructors_count = serializers.ReadOnlyField()
    days_until_expiration = serializers.ReadOnlyField()
    is_trial = serializers.ReadOnlyField()
    
    class Meta:
        model = Organization
        fields = [
            'id', 'name', 'slug', 'organization_type', 'email', 'phone', 
            'website', 'country', 'city', 'address', 'logo', 'primary_color',
            'secondary_color', 'custom_domain', 'max_students', 'max_instructors',
            'subscription_plan', 'created_at', 'subscription_start', 
            'subscription_end', 'is_active', 'trial_end_date', 'settings',
            'current_students_count', 'current_instructors_count', 
            'days_until_expiration', 'is_trial'
        ]
        read_only_fields = ['id', 'slug', 'created_at']


class OrganizationCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear organizaciones"""
    admin_email = serializers.EmailField(write_only=True)
    admin_first_name = serializers.CharField(max_length=150, write_only=True)
    admin_last_name = serializers.CharField(max_length=150, write_only=True)
    
    class Meta:
        model = Organization
        fields = [
            'name', 'organization_type', 'email', 'phone', 'website',
            'country', 'city', 'address', 'subscription_plan',
            'subscription_start', 'subscription_end', 'admin_email',
            'admin_first_name', 'admin_last_name'
        ]
    
    def create(self, validated_data):
        # Extraer datos del administrador
        admin_data = {
            'email': validated_data.pop('admin_email'),
            'first_name': validated_data.pop('admin_first_name'),
            'last_name': validated_data.pop('admin_last_name'),
        }
        
        # Crear organización
        organization = Organization.objects.create(**validated_data)
        
        # Crear o obtener usuario administrador
        admin_user, created = User.objects.get_or_create(
            email=admin_data['email'],
            defaults={
                'username': admin_data['email'],
                'first_name': admin_data['first_name'],
                'last_name': admin_data['last_name'],
            }
        )
        
        # Crear administrador de organización
        OrganizationAdmin.objects.create(
            user=admin_user,
            organization=organization,
            is_primary_admin=True,
            can_manage_organization=True,
            can_manage_billing=True
        )
        
        return organization


class OrganizationAdminSerializer(serializers.ModelSerializer):
    """Serializer para administradores de organización"""
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_full_name = serializers.CharField(source='user.get_full_name', read_only=True)
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    
    class Meta:
        model = OrganizationAdmin
        fields = [
            'id', 'user', 'user_email', 'user_full_name', 'organization',
            'organization_name', 'title', 'department', 'employee_id',
            'can_manage_students', 'can_manage_instructors', 'can_create_courses',
            'can_view_analytics', 'can_manage_billing', 'can_export_data',
            'can_manage_organization', 'notify_new_students', 'notify_course_completion',
            'notify_low_performance', 'weekly_reports', 'created_at', 'is_primary_admin'
        ]
        read_only_fields = ['id', 'created_at']


class OrganizationInvitationSerializer(serializers.ModelSerializer):
    """Serializer para invitaciones de organización"""
    invited_by_name = serializers.CharField(source='invited_by.get_full_name', read_only=True)
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    is_expired = serializers.ReadOnlyField()
    
    class Meta:
        model = OrganizationInvitation
        fields = [
            'id', 'organization', 'organization_name', 'email', 'invitation_type',
            'invited_by', 'invited_by_name', 'token', 'status', 'created_at',
            'expires_at', 'accepted_at', 'message', 'permissions', 'is_expired'
        ]
        read_only_fields = ['id', 'token', 'created_at', 'accepted_at']


class OrganizationStatsSerializer(serializers.Serializer):
    """Serializer para estadísticas de organización"""
    total_students = serializers.IntegerField()
    active_students = serializers.IntegerField()
    total_courses = serializers.IntegerField()
    active_courses = serializers.IntegerField()
    total_lessons_completed = serializers.IntegerField()
    average_completion_rate = serializers.FloatField()
    average_grade = serializers.FloatField()
    students_at_risk = serializers.IntegerField()
    recent_enrollments = serializers.IntegerField()
    monthly_active_users = serializers.IntegerField()