"""
Endpoints /api/me/* — lado usuario web.

El usuario consulta sus propios retos, su gamificación y sus invitaciones
a organizaciones. Permisos: TokenHasScope read/write sobre su propio user.
"""
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from oauth2_provider.contrib.rest_framework import TokenHasScope

from organizations.models import Organization, OrganizationInvitation
from student_management.models import StudentEnrollment

from .models import ChallengeAssignment, MemberBadge
from .serializers import (
    ChallengeSerializer, MemberBadgeSerializer, MemberStatsSerializer,
)
from .views import _build_member_stats_payload


def _my_orgs(user):
    """Orgs en las que el user tiene enrollment activo."""
    org_ids = StudentEnrollment.objects.filter(
        student=user, status__in=['active', 'enrolled'],
    ).values_list('organization_id', flat=True).distinct()
    return Organization.objects.filter(id__in=org_ids)


class MyOrganizationsView(APIView):
    permission_classes = [TokenHasScope]
    required_scopes = ['read']

    def get(self, request):
        orgs = _my_orgs(request.user)
        data = [{
            'id': str(o.id),
            'name': o.name,
            'slug': o.slug,
            'logo': o.logo.url if getattr(o, 'logo', None) and o.logo else None,
        } for o in orgs]
        return Response(data)


class MyInvitationsView(APIView):
    permission_classes = [TokenHasScope]
    required_scopes = ['read']

    def get(self, request):
        qs = OrganizationInvitation.objects.filter(
            email__iexact=request.user.email,
            status='pending',
        ).select_related('organization', 'invited_by')
        data = [{
            'token': str(inv.token),
            'organization_id': str(inv.organization.id),
            'organization_name': inv.organization.name,
            'invitation_type': inv.invitation_type,
            'invited_by': inv.invited_by.email if inv.invited_by else None,
            'message': inv.message,
            'expires_at': inv.expires_at.isoformat(),
            'is_expired': inv.is_expired,
        } for inv in qs]
        return Response(data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def accept_invitation(request, token):
    inv = get_object_or_404(OrganizationInvitation, token=token, status='pending')
    if inv.email.lower() != request.user.email.lower():
        return Response({'error': 'La invitación no es para tu email.'}, status=403)

    # OrganizationInvitation.accept() crea StudentEnrollment sin institutional_id,
    # pero el modelo lo declara obligatorio. Lo creamos manualmente en su lugar.
    if inv.is_expired:
        return Response({'error': 'La invitación ha expirado.'}, status=400)
    if inv.status != 'pending':
        return Response({'error': 'La invitación ya fue procesada.'}, status=400)

    try:
        from organizations.models import OrganizationAdmin
        if inv.invitation_type == 'student':
            StudentEnrollment.objects.get_or_create(
                student=request.user,
                organization=inv.organization,
                course=None,
                defaults={
                    'status': 'active',
                    'institutional_id': f'inv-{request.user.pk}',
                },
            )
        elif inv.invitation_type == 'admin':
            OrganizationAdmin.objects.get_or_create(
                user=request.user, organization=inv.organization,
                defaults=inv.permissions or {},
            )
        inv.status = 'accepted'
        inv.accepted_at = timezone.now()
        inv.save(update_fields=['status', 'accepted_at'])
    except Exception as e:
        return Response({'error': f'No se pudo crear el vínculo: {e}'}, status=500)

    return Response({
        'message': 'Invitación aceptada.',
        'organization_id': str(inv.organization.id),
        'organization_name': inv.organization.name,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def decline_invitation(request, token):
    inv = get_object_or_404(OrganizationInvitation, token=token, status='pending')
    if inv.email.lower() != request.user.email.lower():
        return Response({'error': 'La invitación no es para tu email.'}, status=403)
    inv.status = 'declined'
    inv.save(update_fields=['status'])
    return Response({'message': 'Invitación rechazada.'})


class MyChallengesView(APIView):
    """Retos asignados al user (con progreso). Filtro opcional por status."""
    permission_classes = [TokenHasScope]
    required_scopes = ['read']

    def get(self, request):
        # Re-evaluar el progreso del user antes de devolver — garantiza datos frescos
        # sin depender del cron de Celery ni de signals.
        try:
            from .tasks import evaluate_for_user
            evaluate_for_user(request.user)
        except Exception:
            pass

        qs = (ChallengeAssignment.objects
              .filter(member=request.user)
              .select_related('challenge', 'challenge__reward_badge', 'organization'))
        status_filter = request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)

        data = []
        for a in qs:
            ch_data = ChallengeSerializer(a.challenge, context={}).data
            data.append({
                **ch_data,
                'organization_name': a.organization.name,
                'organization_id': str(a.organization.id),
                'my_progress': {
                    'current_value': str(a.current_value),
                    'progress_percentage': float(a.progress_percentage),
                    'status': a.status,
                    'completed_at': a.completed_at.isoformat() if a.completed_at else None,
                },
            })
        return Response(data)


class MyGamificationView(APIView):
    """
    Stats por organización. Si pertenece a varias, devuelve una lista.
    """
    permission_classes = [TokenHasScope]
    required_scopes = ['read']

    def get(self, request):
        # Evaluar progreso para reflejar puntos/badges recién ganados.
        try:
            from .tasks import evaluate_for_user
            evaluate_for_user(request.user)
        except Exception:
            pass

        orgs = list(_my_orgs(request.user))
        payloads = []
        for org in orgs:
            stats = _build_member_stats_payload(request.user, org)
            stats['organization_id'] = str(org.id)
            stats['organization_name'] = org.name
            payloads.append(stats)
        # Serializar con el serializer existente pero agregando los campos org
        ser = MemberStatsSerializer(payloads, many=True)
        result = ser.data
        # Inyectar org info (no está en el serializer base)
        for i, item in enumerate(result):
            item['organization_id'] = payloads[i]['organization_id']
            item['organization_name'] = payloads[i]['organization_name']
        return Response(result)


class MyBadgesView(APIView):
    permission_classes = [TokenHasScope]
    required_scopes = ['read']

    def get(self, request):
        qs = (MemberBadge.objects
              .filter(member=request.user)
              .select_related('badge', 'organization', 'challenge'))
        ser = MemberBadgeSerializer(qs, many=True)
        data = ser.data
        # Inyectar org y challenge origin
        for i, mb in enumerate(qs):
            data[i]['organization_id'] = str(mb.organization_id)
            data[i]['organization_name'] = mb.organization.name
            if mb.challenge_id:
                data[i]['challenge_name'] = mb.challenge.name
        return Response(data)
