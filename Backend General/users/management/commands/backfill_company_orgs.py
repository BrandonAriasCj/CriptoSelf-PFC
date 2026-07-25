"""Crea Organization + OrganizationAdmin para usuarios company que no la tienen.

Bug historico: RegisterCompanyView creaba solo User + CompanyProfile sin la
Organization, dejando el panel empresa vacio. Este comando es idempotente: solo
toca a quienes les falta el OrganizationAdmin link.

Uso:
    python manage.py backfill_company_orgs
    python manage.py backfill_company_orgs --dry-run
"""
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.utils.text import slugify

from organizations.models import Organization, OrganizationAdmin


User = get_user_model()


class Command(BaseCommand):
    help = 'Crea Organization para usuarios company sin OrganizationAdmin link.'

    def add_arguments(self, parser):
        parser.add_argument('--dry-run', action='store_true',
                            help='Solo mostrar qué se crearía, sin tocar la BD.')

    def handle(self, *args, **options):
        dry = options['dry_run']
        users = User.objects.filter(profile_type='company').order_by('id')
        missing = [u for u in users if not OrganizationAdmin.objects.filter(user=u).exists()]

        if not missing:
            self.stdout.write(self.style.SUCCESS('Nada que hacer: todos los users company tienen org.'))
            return

        self.stdout.write(f'Usuarios company sin org: {len(missing)}')
        for u in missing:
            self.stdout.write(f'  - id={u.id} email={u.email} username={u.username}')

        if dry:
            self.stdout.write(self.style.WARNING('--dry-run: no se modifico nada.'))
            return

        now = timezone.now()
        created = 0
        for u in missing:
            cp = getattr(u, 'company_profile', None)
            name = (cp.company_name if cp and cp.company_name else u.email)
            base_slug = slugify(name) or f'org-{u.id}'
            slug = base_slug
            suffix = 1
            while Organization.objects.filter(slug=slug).exists():
                suffix += 1
                slug = f'{base_slug}-{suffix}'

            org = Organization.objects.create(
                name=name,
                slug=slug,
                organization_type='other',
                email=u.email,
                country=(cp.company_country if cp else '') or '',
                city=(cp.company_city if cp else '') or '',
                subscription_start=now,
                subscription_end=now + timedelta(days=30),
                trial_end_date=now + timedelta(days=30),
            )
            OrganizationAdmin.objects.create(
                user=u,
                organization=org,
                is_primary_admin=True,
                can_manage_students=True,
                can_create_courses=True,
                can_view_analytics=True,
                can_manage_organization=True,
            )
            created += 1
            self.stdout.write(self.style.SUCCESS(
                f'+ Org "{org.name}" (id={org.id}) creada para {u.email}'
            ))

        self.stdout.write(self.style.SUCCESS(f'\nTotal orgs backfilled: {created}'))
