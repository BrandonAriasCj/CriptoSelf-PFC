"""Dispara un digest de mercado manualmente — útil para probar las plantillas
nuevas sin esperar al cron horario / diario / semanal.

Ejemplos:
    python manage.py send_market_digest hourly
    python manage.py send_market_digest daily
    python manage.py send_market_digest weekly
"""

from django.core.management.base import BaseCommand, CommandError

from alerts.tasks import (
    send_market_digest_daily,
    send_market_digest_hourly,
    send_market_digest_weekly,
)


_TASKS = {
    'hourly': send_market_digest_hourly,
    'daily': send_market_digest_daily,
    'weekly': send_market_digest_weekly,
}


class Command(BaseCommand):
    help = 'Envía un digest de mercado a los usuarios suscriptos a esa cadencia.'

    def add_arguments(self, parser):
        parser.add_argument(
            'cadence',
            choices=list(_TASKS.keys()),
            help='Cadencia a disparar: hourly, daily o weekly.',
        )

    def handle(self, *args, **options):
        cadence = options['cadence']
        task = _TASKS.get(cadence)
        if task is None:
            raise CommandError(f'Cadencia desconocida: {cadence}')

        # Llamamos la función .run() directamente (sincrónica) — evitamos depender de
        # que Celery worker esté arriba para esta prueba manual.
        sent = task.run()
        self.stdout.write(self.style.SUCCESS(
            f'Digest {cadence}: enviado a {sent} usuario(s).'
        ))
