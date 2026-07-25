from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import AlertRule, Notification, UserDevice
from .serializers import (
    AlertRuleSerializer,
    NotificationSerializer,
    UserDeviceSerializer,
)

User = get_user_model()


# Suscripciones gestionadas por /api/alerts/subscriptions/. Cada clave es un
# toggle on/off respaldado por un AlertRule con este event_type especial.
SUBSCRIPTION_EVENT_TYPES = {
    'hourly': 'MARKET_DIGEST_HOURLY',
    'daily': 'MARKET_DIGEST_DAILY',
    'weekly': 'MARKET_DIGEST_WEEKLY',
    'suggestions': 'MARKET_SUGGESTION',
}

# Alias retrocompatible (otros módulos importan DIGEST_EVENT_TYPES).
DIGEST_EVENT_TYPES = SUBSCRIPTION_EVENT_TYPES


class AlertRuleViewSet(viewsets.ModelViewSet):
    """CRUD de reglas de alerta. Cada usuario ve solo las suyas.

    Las suscripciones a digests periódicos también viven en AlertRule, pero se
    gestionan exclusivamente por `/api/alerts/subscriptions/` — se excluyen de
    este CRUD para que no aparezcan mezcladas con las reglas configurables.
    """

    serializer_class = AlertRuleSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return AlertRule.objects.filter(user=self.request.user).exclude(
            event_type__in=list(DIGEST_EVENT_TYPES.values()),
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user, is_system=False)

    def perform_update(self, serializer):
        # Las reglas de sistema (is_system=True) no se editan desde el cliente.
        if serializer.instance.is_system:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('Las reglas del sistema no son editables.')
        serializer.save()

    def perform_destroy(self, instance):
        if instance.is_system:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('Las reglas del sistema no se pueden eliminar.')
        instance.delete()


class NotificationViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    """Lectura de notificaciones + acciones para marcar leído."""

    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Notification.objects.filter(user=self.request.user)
        unread = self.request.query_params.get('unread')
        if unread in ('1', 'true', 'True'):
            qs = qs.filter(read_at__isnull=True)
        return qs

    @action(detail=True, methods=['patch'], url_path='read')
    def mark_read(self, request, pk=None):
        notif = self.get_object()
        if notif.read_at is None:
            notif.read_at = timezone.now()
            notif.save(update_fields=['read_at'])
        return Response(self.get_serializer(notif).data)

    @action(detail=False, methods=['post'], url_path='mark-all-read')
    def mark_all_read(self, request):
        updated = self.get_queryset().filter(read_at__isnull=True).update(
            read_at=timezone.now(),
        )
        return Response({'updated': updated})

    @action(detail=False, methods=['get'], url_path='unread-count')
    def unread_count(self, request):
        count = Notification.objects.filter(user=request.user, read_at__isnull=True).count()
        return Response({'count': count})


class UserDeviceViewSet(viewsets.ModelViewSet):
    """Registro de dispositivos web/móviles para entrega push."""

    serializer_class = UserDeviceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return UserDevice.objects.filter(user=self.request.user)

    def create(self, request, *args, **kwargs):
        # Upsert por (user, platform, token): si ya existe, lo reactivamos.
        platform = request.data.get('platform')
        token = request.data.get('token')
        existing = UserDevice.objects.filter(
            user=request.user, platform=platform, token=token,
        ).first()
        if existing:
            existing.enabled = True
            existing.name = request.data.get('name', existing.name)
            existing.save(update_fields=['enabled', 'name', 'last_seen_at'])
            return Response(self.get_serializer(existing).data, status=status.HTTP_200_OK)
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class SubscriptionsView(APIView):
    """Suscripciones a digests periódicos de mercado.

    GET → estado actual: {hourly: bool, daily: bool, weekly: bool}
    PUT → toggle bulk. Cualquier cadence omitida en el body queda sin cambios.

    Bajo el capó cada suscripción es un AlertRule con event_type especial. El
    usuario no interactúa con ese detalle — sólo activa/desactiva.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(self._current_state(request.user))

    def put(self, request):
        data = request.data if isinstance(request.data, dict) else {}
        with transaction.atomic():
            for cadence, event_type in DIGEST_EVENT_TYPES.items():
                if cadence not in data:
                    continue
                wanted = bool(data[cadence])
                rule = AlertRule.objects.filter(
                    user=request.user, event_type=event_type,
                ).first()
                if wanted:
                    if rule is None:
                        AlertRule.objects.create(
                            user=request.user,
                            name=f'Resumen {cadence}',
                            event_type=event_type,
                            params={},
                            enabled=True,
                            cooldown_seconds=0,
                        )
                    elif not rule.enabled:
                        rule.enabled = True
                        rule.save(update_fields=['enabled', 'updated_at'])
                else:
                    if rule is not None and rule.enabled:
                        rule.enabled = False
                        rule.save(update_fields=['enabled', 'updated_at'])
        return Response(self._current_state(request.user))

    def _current_state(self, user) -> dict:
        active_types = set(
            AlertRule.objects
            .filter(
                user=user,
                event_type__in=list(DIGEST_EVENT_TYPES.values()),
                enabled=True,
            )
            .values_list('event_type', flat=True)
        )
        return {
            cadence: event_type in active_types
            for cadence, event_type in DIGEST_EVENT_TYPES.items()
        }


class EventTypeView(viewsets.ViewSet):
    """Catálogo de event_types configurables por el usuario.

    Sólo expone los `user_configurable=True` — los digests y broadcasts del
    sistema se gestionan por sus propios endpoints.
    """

    permission_classes = [IsAuthenticated]

    def list(self, request):
        from .events import registry
        return Response([
            e for e in registry.describe_all() if e['user_configurable']
        ])


# ---------------------------------------------------------------------------
# Panel de TEST de alertas (demo en vivo desde Empresa Web)
# ---------------------------------------------------------------------------

def _demo_allowed(user) -> bool:
    """Solo cuentas empresa o staff pueden disparar alertas de prueba."""
    return bool(
        getattr(user, 'is_staff', False)
        or getattr(user, 'profile_type', None) == 'company'
    )


class DemoUsersView(APIView):
    """Lista de usuarios destino (web/móvil) para el dropdown del panel de test."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not settings.ALERTS_DEMO_ENABLED:
            return Response({'detail': 'Demo deshabilitado.'}, status=status.HTTP_403_FORBIDDEN)
        if not _demo_allowed(request.user):
            return Response({'detail': 'No autorizado.'}, status=status.HTTP_403_FORBIDDEN)
        # Cualquier usuario activo puede ser destino (la notificación se entrega a
        # su cuenta). Incluimos también cuentas 'company' — el panel marca el tipo
        # para que el presentador sepa cuál abrir en Usuario Web.
        users = (
            User.objects
            .filter(is_active=True)
            .order_by('-date_joined')[:200]
        )
        return Response([
            {
                'id': u.id,
                'email': u.email,
                'name': (f'{u.first_name} {u.last_name}').strip() or u.username,
                'profile_type': u.profile_type,
            }
            for u in users
        ])


class DemoTriggerView(APIView):
    """Dispara una alerta de prueba de cualquiera de los 4 tipos hacia un usuario.

    Body: {target_email, kind: welcome|rule|suggestion|digest, symbol?}
    La notificación se crea y se entrega por WebSocket en tiempo real al destino.
    """

    permission_classes = [IsAuthenticated]
    KINDS = {'welcome', 'rule', 'suggestion', 'digest'}

    def post(self, request):
        if not settings.ALERTS_DEMO_ENABLED:
            return Response({'detail': 'Demo deshabilitado.'}, status=status.HTTP_403_FORBIDDEN)
        if not _demo_allowed(request.user):
            return Response({'detail': 'No autorizado.'}, status=status.HTTP_403_FORBIDDEN)

        kind = request.data.get('kind')
        if kind not in self.KINDS:
            return Response(
                {'detail': f'kind inválido. Use uno de {sorted(self.KINDS)}.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        target_email = (request.data.get('target_email') or '').strip()
        target = User.objects.filter(email__iexact=target_email).first()
        if target is None:
            return Response(
                {'detail': f'No existe un usuario con email {target_email!r}.'},
                status=status.HTTP_404_NOT_FOUND,
            )
        symbol = (request.data.get('symbol') or 'BTC/USDT').strip().upper()

        try:
            notif = self._build_and_dispatch(kind, target, symbol)
        except Exception as exc:  # noqa: BLE001 — superficie de demo, devolvemos el motivo
            return Response(
                {'detail': f'Error generando la alerta: {exc}'},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        if notif is None:
            return Response(
                {'detail': 'No se pudo construir la alerta (¿sin datos de mercado para el símbolo?).'},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        return Response({
            'ok': True,
            'delivered_to': target.email,
            'notification': {
                'id': notif.id,
                'title': notif.title,
                'body': notif.body,
                'severity': notif.severity,
                'payload': notif.payload,
            },
        })

    def _build_and_dispatch(self, kind, target, symbol):
        from .services import dispatcher

        if kind == 'welcome':
            from .services.onboarding import _WELCOME_NOTIFICATIONS, WELCOME_KIND
            item = _WELCOME_NOTIFICATIONS[0]
            return dispatcher.dispatch(
                user=target,
                title=item['title'],
                body=item['body'],
                severity=Notification.Severity.INFO,
                payload={'kind': WELCOME_KIND, 'step': item['step'], 'demo': True},
            )

        if kind == 'rule':
            from .services.price_feed import PriceFeed
            from .services.templates import threshold_message
            price = PriceFeed().get_price(symbol)
            if price is None:
                return None
            threshold = round(price * 0.99, 2)  # ya cruzado al alza, para el demo
            title, body = threshold_message(symbol, '>=', threshold, price)
            return dispatcher.dispatch(
                user=target,
                title=title,
                body=body,
                severity=Notification.Severity.INFO,
                payload={
                    'kind': 'rule_demo', 'symbol': symbol, 'price': price,
                    'threshold': threshold, 'operator': '>=', 'demo': True,
                },
            )

        if kind == 'suggestion':
            from .services.price_feed import PriceFeed
            from .services.suggestions import analyze_crossover, build_suggestion_message
            analysis = analyze_crossover(symbol, PriceFeed())
            if analysis is None:
                return None
            msg = build_suggestion_message(analysis)
            msg['payload']['demo'] = True
            return dispatcher.dispatch(
                user=target,
                title=msg['title'],
                body=msg['body'],
                severity=msg['severity'],
                payload=msg['payload'],
            )

        if kind == 'digest':
            from .services.market_digest import build_digest
            from .services.price_feed import PriceFeed
            digest = build_digest('daily', feed=PriceFeed())
            if digest is None:
                return None
            payload = dict(digest['payload'])
            payload['demo'] = True
            return dispatcher.dispatch(
                user=target,
                title=digest['title'],
                body=digest['body'],
                severity=digest['severity'],
                payload=payload,
            )

        return None
