"""Crea o actualiza la OAuth2 Application con client_id/secret especificos.

Idempotente - safe to run en cada arranque del container.
Usado por el entrypoint para asegurar que el cliente OAuth del frontend existe en BD.

Variables de entorno (o pasadas via --client-id / --client-secret):
    OAUTH_CLIENT_ID       -> Application.client_id (debe coincidir con VITE_OAUTH_CLIENT_ID)
    OAUTH_CLIENT_SECRET   -> Application.client_secret
"""
import os
from django.core.management.base import BaseCommand
from oauth2_provider.models import Application


class Command(BaseCommand):
    help = 'Asegura que existe una OAuth Application con el client_id/secret indicado (idempotente).'

    def add_arguments(self, parser):
        parser.add_argument('--name', default='CriptoSelf Frontend')
        parser.add_argument('--client-id',     default=os.getenv('OAUTH_CLIENT_ID', ''))
        parser.add_argument('--client-secret', default=os.getenv('OAUTH_CLIENT_SECRET', ''))

    def handle(self, *args, **opts):
        cid    = opts['client_id']
        secret = opts['client_secret']
        name   = opts['name']

        if not cid or not secret:
            self.stdout.write(self.style.WARNING(
                'ensure_oauth_app: OAUTH_CLIENT_ID o OAUTH_CLIENT_SECRET vacios. Saltando.'
            ))
            return

        app, created = Application.objects.update_or_create(
            client_id=cid,
            defaults={
                'name': name,
                'client_secret': secret,
                'client_type': Application.CLIENT_CONFIDENTIAL,
                'authorization_grant_type': Application.GRANT_PASSWORD,
            },
        )
        action = 'creada' if created else 'actualizada'
        self.stdout.write(self.style.SUCCESS(
            f'OAuth Application "{name}" {action} (client_id={cid[:8]}...)'
        ))
