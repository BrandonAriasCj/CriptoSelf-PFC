import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from lessons.models import Lesson

# Configurar tiempos por lección
tiempos = {
    '¿Qué es el Trading?': 5,
    'Terminología Básica del Trading': 5,
    'Introducción al Análisis Técnico': 5,
    'Fundamentos de la Gestión de Riesgo': 5,
    'Introducción al Trading Algorítmico': 5,
}

for titulo, minutos in tiempos.items():
    Lesson.objects.filter(title=titulo).update(duration_minutes=minutos)
    print(f'✓ {titulo}: {minutos} minutos')
