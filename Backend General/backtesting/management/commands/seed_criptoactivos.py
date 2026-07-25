"""Seed idempotente de Criptoactivos con IDs deterministas.

El frontend Usuario Web hardcodea CRYPTO_MAP = { 'BTC/USDT': 1, 'ETH/USDT': 2,
'ADA/USDT': 3, 'SOL/USDT': 4 } en types/operations.ts. Si los IDs en BD no
matchean estos valores, el POST /api/operaciones/ falla con "Clave primaria
invalida - objeto no existe".

Este comando garantiza que esos IDs existan con los simbolos correctos.
Es idempotente: corre en cada arranque del backend via entrypoint sin duplicar
ni reordenar.

Uso:
    python manage.py seed_criptoactivos
"""
from django.core.management.base import BaseCommand
from django.db import connection

from backtesting.models import Criptoactivo


# Mantener sincronizado con Perfil Usuario Web/src/types/operations.ts:CRYPTO_MAP
CRIPTOACTIVOS = [
    (1, 'BTC', 'Bitcoin',  1),
    (2, 'ETH', 'Ethereum', 2),
    (3, 'ADA', 'Cardano',  8),
    (4, 'SOL', 'Solana',   5),
]


class Command(BaseCommand):
    help = 'Sembrar Criptoactivos basicos (BTC/ETH/ADA/SOL) con IDs deterministas.'

    def handle(self, *args, **options):
        for pk, symbol, name, rank in CRIPTOACTIVOS:
            obj, created = Criptoactivo.objects.update_or_create(
                pk=pk,
                defaults={
                    'symbol':           symbol,
                    'name':             name,
                    'market_cap_rank':  rank,
                    'is_active':        True,
                },
            )
            verb = 'creado' if created else 'actualizado'
            self.stdout.write(self.style.SUCCESS(f'  {pk}: {symbol} - {name} ({verb})'))

        # Resincronizar sqlite_sequence al max(id) para evitar colisiones futuras
        # si alguien crea Criptoactivos adicionales via admin/API tras el seed.
        if connection.vendor == 'sqlite':
            with connection.cursor() as cur:
                max_pk = max(pk for pk, *_ in CRIPTOACTIVOS)
                cur.execute(
                    "INSERT OR REPLACE INTO sqlite_sequence (name, seq) VALUES (%s, %s)",
                    ['backtesting_criptoactivo', max_pk]
                )
                self.stdout.write(f'  sqlite_sequence resyncado a {max_pk}')

        self.stdout.write(self.style.SUCCESS('OK - Criptoactivos sembrados'))
