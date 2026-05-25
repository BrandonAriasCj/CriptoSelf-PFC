from django.core.management.base import BaseCommand
from oauth2_provider.models import Application


class Command(BaseCommand):
    help = 'Crea una aplicación OAuth2 para desarrollo'

    def add_arguments(self, parser):
        parser.add_argument(
            '--name',
            type=str,
            default='Development App',
            help='Nombre de la aplicación OAuth2'
        )
        parser.add_argument(
            '--client-type',
            type=str,
            choices=['confidential', 'public'],
            default='confidential',
            help='Tipo de cliente OAuth2'
        )
        parser.add_argument(
            '--grant-type',
            type=str,
            choices=['authorization-code', 'client-credentials', 'password'],
            default='password',
            help='Tipo de grant OAuth2'
        )

    def handle(self, *args, **options):
        name = options['name']
        client_type = Application.CLIENT_CONFIDENTIAL if options['client_type'] == 'confidential' else Application.CLIENT_PUBLIC
        
        grant_type_mapping = {
            'authorization-code': Application.GRANT_AUTHORIZATION_CODE,
            'client-credentials': Application.GRANT_CLIENT_CREDENTIALS,
            'password': Application.GRANT_PASSWORD,
        }
        grant_type = grant_type_mapping[options['grant_type']]

        # Verificar si ya existe una aplicación con este nombre
        if Application.objects.filter(name=name).exists():
            self.stdout.write(
                self.style.WARNING(f'La aplicación "{name}" ya existe.')
            )
            app = Application.objects.get(name=name)
        else:
            # Crear nueva aplicación
            app = Application.objects.create(
                name=name,
                client_type=client_type,
                authorization_grant_type=grant_type,
            )
            self.stdout.write(
                self.style.SUCCESS(f'Aplicación OAuth2 "{name}" creada exitosamente.')
            )

        # Mostrar información de la aplicación
        self.stdout.write('\n' + '='*50)
        self.stdout.write(f'Nombre: {app.name}')
        self.stdout.write(f'Client ID: {app.client_id}')
        self.stdout.write(f'Client Secret: {app.client_secret}')
        self.stdout.write(f'Tipo de Cliente: {app.get_client_type_display()}')
        self.stdout.write(f'Grant Type: {app.get_authorization_grant_type_display()}')
        self.stdout.write('='*50)
        
        self.stdout.write('\nGuarda estas credenciales de forma segura.')
        self.stdout.write('Las necesitarás para autenticar tu aplicación frontend.')
        
        if grant_type == Application.GRANT_PASSWORD:
            self.stdout.write('\nEjemplo de uso con curl:')
            self.stdout.write(f'''
curl -X POST http://localhost:8000/api/auth/token/ \\
  -H "Content-Type: application/json" \\
  -d '{{
    "username": "tu_email@ejemplo.com",
    "password": "tu_contraseña",
    "client_id": "{app.client_id}",
    "client_secret": "{app.client_secret}"
  }}'
            ''')