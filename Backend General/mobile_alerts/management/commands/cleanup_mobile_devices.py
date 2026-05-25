"""
Comando de Django para limpiar dispositivos móviles inactivos.

Uso:
    python manage.py cleanup_mobile_devices
    python manage.py cleanup_mobile_devices --days 60
"""

from django.core.management.base import BaseCommand
from mobile_alerts.services import MobileDeviceManager


class Command(BaseCommand):
    help = 'Limpia dispositivos móviles inactivos'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--days',
            type=int,
            default=30,
            help='Días de inactividad antes de eliminar dispositivos (default: 30)'
        )
        
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Mostrar qué se eliminaría sin hacer cambios'
        )
    
    def handle(self, *args, **options):
        days = options['days']
        dry_run = options['dry_run']
        
        if dry_run:
            self.stdout.write(f'[DRY RUN] Simulando limpieza de dispositivos inactivos por >{days} días...')
        else:
            self.stdout.write(f'Limpiando dispositivos inactivos por >{days} días...')
        
        try:
            if dry_run:
                # TODO: Implementar conteo sin eliminar
                self.stdout.write('Función dry-run no implementada aún')
            else:
                deleted_count = MobileDeviceManager.cleanup_inactive_devices(days)
                
                if deleted_count > 0:
                    self.stdout.write(
                        self.style.SUCCESS(
                            f'✓ Se eliminaron {deleted_count} dispositivos inactivos'
                        )
                    )
                else:
                    self.stdout.write(
                        self.style.SUCCESS('✓ No hay dispositivos inactivos para eliminar')
                    )
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'✗ Error en limpieza: {e}')
            )
            raise