"""Corre una pasada del evaluador desde la línea de comandos.

Útil para:
- Probar manualmente sin tener Celery beat corriendo.
- Cron simple (en producción si no se quiere desplegar Celery beat).
"""

from django.core.management.base import BaseCommand

from alerts.services.evaluator import evaluate_all_rules


class Command(BaseCommand):
    help = 'Ejecuta una pasada del evaluador de reglas de alerta'

    def handle(self, *args, **options):
        triggered = evaluate_all_rules()
        self.stdout.write(self.style.SUCCESS(
            f'Evaluador finalizado. Notificaciones disparadas: {triggered}'
        ))
