"""
Comando de Django para configurar alertas móviles iniciales.

Uso:
    python manage.py setup_mobile_alerts
"""

from django.core.management.base import BaseCommand
from mobile_alerts.services import MobileAlertService


class Command(BaseCommand):
    help = 'Configura alertas predefinidas del sistema para dispositivos móviles'
    
    def handle(self, *args, **options):
        self.stdout.write('Configurando alertas del sistema para móviles...')
        
        try:
            created_count = MobileAlertService.create_system_alert_subscriptions()
            
            if created_count > 0:
                self.stdout.write(
                    self.style.SUCCESS(
                        f'✓ Se crearon {created_count} nuevas reglas de alerta del sistema'
                    )
                )
            else:
                self.stdout.write(
                    self.style.WARNING(
                        '⚠ No se crearon nuevas reglas (ya existían)'
                    )
                )
            
            self.stdout.write(
                self.style.SUCCESS('✓ Configuración de alertas móviles completada')
            )
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'✗ Error configurando alertas: {e}')
            )
            raise