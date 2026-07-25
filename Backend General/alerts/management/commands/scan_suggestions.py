"""Corre el escaneo de sugerencias (cruce de medias) a mano.

Útil para debug/demo sin esperar al beat de Celery. Idéntico a la tarea
`alerts.tasks.scan_market_suggestions`.

Uso:
    python manage.py scan_suggestions
    python manage.py scan_suggestions --analyze BTC/USDT   # solo muestra el análisis
"""

from __future__ import annotations

from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'Escanea símbolos buscando cruces de medias y notifica a los suscriptores.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--analyze',
            help='Solo imprime el análisis de un símbolo (no despacha nada).',
        )

    def handle(self, *args, **options):
        if options.get('analyze'):
            from alerts.services.price_feed import PriceFeed
            from alerts.services.suggestions import analyze_crossover

            res = analyze_crossover(options['analyze'], PriceFeed())
            self.stdout.write(str(res))
            return

        from alerts.tasks import scan_market_suggestions

        sent = scan_market_suggestions()
        self.stdout.write(self.style.SUCCESS(f'Escaneo completo. Notificaciones: {sent}'))
