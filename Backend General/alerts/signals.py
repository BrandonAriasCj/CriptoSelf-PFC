"""Signals del sistema de alertas.

Engancha el onboarding de notificaciones al alta de usuarios: en cuanto se crea
un User (por cualquier vía — registro email, Google web/móvil, social), le
sembramos notificaciones de bienvenida y lo suscribimos al resumen diario.

Se hace por signal en lugar de en cada vista de registro para no duplicar la
lógica entre los ~4 endpoints que crean usuarios.
"""

from __future__ import annotations

import logging

from django.contrib.auth import get_user_model
from django.db.models.signals import post_save
from django.dispatch import receiver

logger = logging.getLogger(__name__)
User = get_user_model()

# Solo estos perfiles consumen la sección de alertas (Usuario Web / Móvil).
# Las cuentas empresa usan otro frontend y no deben recibir bienvenida acá.
_ONBOARDING_PROFILE_TYPES = {'web_user', 'mobile_user'}


@receiver(post_save, sender=User, dispatch_uid='alerts.onboard_new_user')
def onboard_new_user(sender, instance, created, **kwargs):
    if not created:
        return
    if instance.profile_type not in _ONBOARDING_PROFILE_TYPES:
        return

    from alerts.services.onboarding import run_onboarding

    try:
        run_onboarding(instance)
    except Exception:
        # El onboarding nunca debe romper el alta del usuario.
        logger.exception('Fallo en onboarding de alertas para user=%s', instance.pk)
