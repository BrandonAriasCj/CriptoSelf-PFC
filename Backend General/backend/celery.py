"""Configuración de Celery — usado por el evaluador de alertas (Bloque 6).

Arrancar en local:
    celery -A backend worker -l info        # worker
    celery -A backend beat   -l info        # scheduler
"""

import os

from celery import Celery
from celery.schedules import crontab

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

app = Celery('backend')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

# Beat schedule.
# - evaluador genérico: cada 30s, evalúa reglas configurables (price threshold, etc.)
# - digests de mercado: anclados a horarios fijos. UTC.
app.conf.beat_schedule = {
    'alerts-evaluate-rules': {
        'task': 'alerts.tasks.evaluate_alerts',
        'schedule': 30.0,
    },
    'alerts-digest-hourly': {
        'task': 'alerts.tasks.send_market_digest_hourly',
        'schedule': crontab(minute=0),  # top of hour
    },
    'alerts-digest-daily': {
        'task': 'alerts.tasks.send_market_digest_daily',
        'schedule': crontab(minute=0, hour=9),  # 09:00 UTC
    },
    'alerts-digest-weekly': {
        'task': 'alerts.tasks.send_market_digest_weekly',
        'schedule': crontab(minute=0, hour=9, day_of_week=1),  # lunes 09:00 UTC
    },
    'gamification-evaluate-challenges': {
        'task': 'gamification.evaluate_challenges',
        'schedule': 300.0,  # cada 5 min
    },
}
