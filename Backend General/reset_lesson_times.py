#!/usr/bin/env python
"""
Script para resetear los tiempos de las lecciones que tienen valores incorrectos
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from lessons.models import LessonProgress

def reset_lesson_times():
    """Resetear tiempos exorbitantes a valores razonables"""
    
    # Obtener todos los progresos con tiempos mayores a 120 minutos (2 horas)
    problematic_progress = LessonProgress.objects.filter(time_spent_minutes__gt=120)
    
    count = problematic_progress.count()
    
    if count == 0:
        print("✅ No hay tiempos problemáticos para corregir")
        return
    
    print(f"🔍 Encontrados {count} registros con tiempos incorrectos")
    
    # Mostrar algunos ejemplos
    print("\n📊 Ejemplos de tiempos incorrectos:")
    for progress in problematic_progress[:5]:
        print(f"  - Usuario: {progress.user.username}, Lección: {progress.lesson.title}")
        print(f"    Tiempo actual: {progress.time_spent_minutes} minutos ({progress.time_spent_minutes/60:.1f} horas)")
        print(f"    Progreso: {progress.progress_percentage}%")
    
    # Resetear a valores razonables basados en el progreso
    print("\n🔧 Reseteando tiempos...")
    
    for progress in problematic_progress:
        # Calcular tiempo razonable: 1 minuto por cada 10% de progreso
        # Mínimo 1 minuto, máximo 30 minutos
        reasonable_time = max(1, min(30, progress.progress_percentage // 10))
        
        old_time = progress.time_spent_minutes
        progress.time_spent_minutes = reasonable_time
        progress.save()
        
        print(f"  ✓ {progress.lesson.title}: {old_time} min → {reasonable_time} min")
    
    print(f"\n✅ {count} registros corregidos exitosamente")
    
    # Mostrar estadísticas finales
    total_progress = LessonProgress.objects.count()
    avg_time = LessonProgress.objects.aggregate(
        avg_time=django.db.models.Avg('time_spent_minutes')
    )['avg_time'] or 0
    
    print(f"\n📈 Estadísticas finales:")
    print(f"  - Total de progresos: {total_progress}")
    print(f"  - Tiempo promedio: {avg_time:.1f} minutos")
    print(f"  - Tiempo máximo: {LessonProgress.objects.aggregate(max_time=django.db.models.Max('time_spent_minutes'))['max_time'] or 0} minutos")

if __name__ == '__main__':
    print("🚀 Iniciando corrección de tiempos de lecciones...\n")
    reset_lesson_times()
    print("\n✨ Proceso completado")
