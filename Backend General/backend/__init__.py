"""Backend package.

Carga la app de Celery cuando Django arranca para que `@shared_task`
quede vinculado a la instancia correcta.
"""

from .celery import app as celery_app

__all__ = ('celery_app',)
