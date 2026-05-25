from django.core.management.base import BaseCommand
from lessons.models import Lesson


class Command(BaseCommand):
    help = 'Actualizar duraciones de las lecciones'

    def handle(self, *args, **options):
        self.stdout.write('Actualizando duraciones de lecciones...')
        
        # Configurar tiempos por lección
        duraciones = {
            '¿Qué es el Trading?': 15,
            'Terminología Básica del Trading': 20,
            'Introducción al Análisis Técnico': 25,
            'Fundamentos de la Gestión de Riesgo': 30,
            'Introducción al Trading Algorítmico': 35,
        }
        
        for titulo, minutos in duraciones.items():
            updated = Lesson.objects.filter(title=titulo).update(duration_minutes=minutos)
            if updated:
                self.stdout.write(self.style.SUCCESS(f'✓ {titulo}: {minutos} minutos'))
            else:
                self.stdout.write(self.style.WARNING(f'⚠ No encontrada: {titulo}'))
        
        self.stdout.write(self.style.SUCCESS('\n¡Duraciones actualizadas!'))
