"""Backfill de onboarding de notificaciones para usuarios ya existentes.

El signal `post_save` solo cubre altas nuevas. Los usuarios creados antes de
habilitar el onboarding siguen viendo la sección de alertas vacía. Este comando
les corre el mismo onboarding (bienvenida + suscripción al digest diario).

Es idempotente: cada paso se saltea si el usuario ya lo tiene, así que se puede
correr varias veces sin duplicar nada.

Uso:
    python manage.py onboard_existing_users            # todos los Usuario Web/Móvil
    python manage.py onboard_existing_users --email x@y # un solo usuario
    python manage.py onboard_existing_users --dry-run   # solo reporta, no escribe
"""

from __future__ import annotations

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from alerts.services.onboarding import (
    ensure_daily_digest_subscription,
    ensure_suggestions_subscription,
    seed_welcome_notifications,
)

User = get_user_model()

_PROFILE_TYPES = ['web_user', 'mobile_user']


class Command(BaseCommand):
    help = 'Siembra notificaciones de bienvenida y suscripción diaria a usuarios existentes.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--email',
            help='Procesar solo el usuario con este email.',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='No escribe; solo reporta a cuántos usuarios afectaría.',
        )

    def handle(self, *args, **options):
        qs = User.objects.filter(profile_type__in=_PROFILE_TYPES)
        if options.get('email'):
            qs = qs.filter(email=options['email'])

        total = qs.count()
        self.stdout.write(f'Usuarios candidatos: {total}')

        if options.get('dry_run'):
            self.stdout.write(self.style.WARNING('--dry-run: no se escribió nada.'))
            return

        subscribed = 0
        welcomed = 0
        for user in qs.iterator():
            changed = ensure_daily_digest_subscription(user)
            changed = ensure_suggestions_subscription(user) or changed
            if changed:
                subscribed += 1
            if seed_welcome_notifications(user):
                welcomed += 1

        self.stdout.write(self.style.SUCCESS(
            f'Listo. Nuevas suscripciones diarias: {subscribed}. '
            f'Usuarios con bienvenida sembrada: {welcomed}.'
        ))
