from django.core.management.base import BaseCommand
from gamification.tasks import evaluate_challenges


class Command(BaseCommand):
    help = 'Ejecuta la evaluación de progreso de retos a mano (sin Celery worker).'

    def handle(self, *args, **options):
        result = evaluate_challenges()
        self.stdout.write(self.style.SUCCESS(
            f"Evaluación completa: {result['evaluated']} assignments revisados, "
            f"{result['completed']} completados."
        ))
