from django.core.management.base import BaseCommand
from gamification.models import Badge


SYSTEM_BADGES = [
    {'name': 'Primera Operación', 'icon': '🎯',  'rarity': 'common',
     'description': 'Completó su primera operación',
     'criteria': 'Realizar 1 operación'},
    {'name': 'Diamond Hands',     'icon': '💎',  'rarity': 'rare',
     'description': 'Mantuvo una racha de 7 días',
     'criteria': '7 días consecutivos operando'},
    {'name': 'Backtest Master',   'icon': '🧠',  'rarity': 'epic',
     'description': 'Corrió 100 backtests',
     'criteria': '100 backtests acumulados'},
    {'name': 'Sharpshooter',      'icon': '🎯',  'rarity': 'rare',
     'description': 'Logró Sharpe > 2',
     'criteria': 'Sharpe ratio > 2 en backtest'},
    {'name': 'Speed Trader',      'icon': '⚡',  'rarity': 'rare',
     'description': '50 trades en un día',
     'criteria': '50 operaciones en 24h'},
    {'name': 'Risk Manager',      'icon': '🛡️',  'rarity': 'epic',
     'description': 'Drawdown < 5% por 30 días',
     'criteria': 'Max drawdown < 5% durante 30 días'},
    {'name': 'Top 10%',           'icon': '🌟',  'rarity': 'rare',
     'description': 'Terminó en top 10% del mes',
     'criteria': 'Quedar entre los mejores del leaderboard mensual'},
    {'name': 'Champion',          'icon': '👑',  'rarity': 'legendary',
     'description': 'Ganó el reto del mes',
     'criteria': 'Primer puesto en un reto destacado'},
]


class Command(BaseCommand):
    help = 'Crea (o actualiza) los badges globales del sistema'

    def handle(self, *args, **options):
        created = updated = 0
        for entry in SYSTEM_BADGES:
            obj, was_created = Badge.objects.update_or_create(
                organization=None,
                name=entry['name'],
                defaults={
                    'icon': entry['icon'],
                    'rarity': entry['rarity'],
                    'description': entry['description'],
                    'criteria': entry['criteria'],
                    'is_system': True,
                },
            )
            if was_created:
                created += 1
            else:
                updated += 1
        self.stdout.write(self.style.SUCCESS(
            f'Seed completo: {created} creados, {updated} actualizados.'
        ))
