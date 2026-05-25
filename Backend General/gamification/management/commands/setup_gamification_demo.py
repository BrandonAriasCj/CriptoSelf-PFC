"""
Crea data mínima para probar el flujo end-to-end:
  - 1 Organization "Demo Org" (idempotente por slug)
  - Asigna como admin al user con --admin-email (si existe)
  - 1 Challenge global activo "Tu primer backtest" (1 backtest, 100 pts, badge "Primera Operación")

Uso:
    python manage.py setup_gamification_demo --admin-email empresa@ejemplo.com
    python manage.py setup_gamification_demo --admin-email empresa@ejemplo.com --invite usuario@ejemplo.com
"""
from datetime import timedelta
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone

from organizations.models import Organization, OrganizationAdmin, OrganizationInvitation
from student_management.models import StudentEnrollment
from gamification.models import Badge, Challenge

User = get_user_model()


class Command(BaseCommand):
    help = 'Setup mínimo para probar gamificación end-to-end.'

    def add_arguments(self, parser):
        parser.add_argument('--admin-email', required=True,
                            help='Email del user (existente) que será admin de la org demo.')
        parser.add_argument('--invite', action='append', default=[],
                            help='Email de usuario web a invitar a la org (repetible).')

    def handle(self, *args, **options):
        admin_email = options['admin_email']
        try:
            admin_user = User.objects.get(email__iexact=admin_email)
        except User.DoesNotExist:
            self.stderr.write(self.style.ERROR(
                f"No existe user con email {admin_email}. Crealo primero (registro normal o createsuperuser)."
            ))
            return

        # 1. Organization
        org, created = Organization.objects.get_or_create(
            slug='demo-org',
            defaults={
                'name': 'Demo Org',
                'organization_type': 'corporate',
                'email': admin_email,
                'country': 'AR',
                'city': 'Buenos Aires',
            },
        )
        self.stdout.write(f"Org {'creada' if created else 'reutilizada'}: {org.name} ({org.id})")

        # 2. Admin
        admin_obj, admin_created = OrganizationAdmin.objects.get_or_create(
            user=admin_user, organization=org,
            defaults={'is_primary_admin': True, 'can_manage_organization': True},
        )
        self.stdout.write(f"Admin {'creado' if admin_created else 'reutilizado'}: {admin_user.email}")

        # 3. Challenge "Tu primer backtest"
        primer_badge = Badge.objects.filter(organization__isnull=True,
                                            name='Primera Operación').first()
        now = timezone.now()
        ch, ch_created = Challenge.objects.get_or_create(
            organization=org, name='Tu primer backtest',
            defaults={
                'description': 'Realizá tu primer backtest para empezar a sumar puntos.',
                'metric': 'backtests',
                'target_value': 1,
                'unit': 'backtests',
                'reward_points': 100,
                'reward_badge': primer_badge,
                'difficulty': 'easy',
                'status': 'active',
                'is_global': True,
                'start_date': now,
                'end_date': now + timedelta(days=30),
                'created_by': admin_user,
            },
        )
        self.stdout.write(f"Challenge {'creado' if ch_created else 'reutilizado'}: {ch.name} ({ch.id})")

        # 4. Invitaciones a usuarios web
        for email in options['invite']:
            inv, inv_created = OrganizationInvitation.objects.get_or_create(
                organization=org, email=email, invitation_type='student',
                defaults={
                    'invited_by': admin_user,
                    'expires_at': now + timedelta(days=14),
                    'message': 'Te invitamos a participar en nuestros retos.',
                },
            )
            self.stdout.write(f"Invitación a {email}: {'enviada' if inv_created else 'ya existía'} (token: {inv.token})")

        # 5. Si admin_user es además web_user, lo auto-inscribimos para verlo del lado usuario
        # Nota: para que un user vea retos del lado /api/me/* tiene que existir StudentEnrollment.
        # Si el admin de empresa también es trader web, lo enrollamos automáticamente.
        if getattr(admin_user, 'profile_type', None) in ('web_user', 'mobile_user'):
            StudentEnrollment.objects.get_or_create(
                student=admin_user, organization=org, course=None,
                defaults={'status': 'active', 'institutional_id': f'demo-{admin_user.pk}'},
            )
            self.stdout.write(f"Enrollment auto-creado para {admin_user.email}")

        self.stdout.write(self.style.SUCCESS(
            f"\n✓ Setup completo. Organization ID: {org.id}"
        ))
        self.stdout.write("\nProbar end-to-end:")
        self.stdout.write("  1. Loguearse en Empresa Web con el admin → debería ver la org demo y el reto activo")
        self.stdout.write("  2. El usuario invitado entra a Usuario Web → ve la invitación en /my-challenges → la acepta")
        self.stdout.write("  3. El usuario corre un backtest desde Usuario Web")
        self.stdout.write("  4. Correr: python manage.py evaluate_challenges")
        self.stdout.write("  5. El usuario refresca /my-challenges → ve el reto al 100% + 100 pts + badge")
