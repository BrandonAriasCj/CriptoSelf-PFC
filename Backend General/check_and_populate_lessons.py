#!/usr/bin/env python
"""
Script para verificar y poblar lecciones en la base de datos
"""
import os
import sys
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from lessons.models import LessonCategory, Lesson

def check_lessons():
    """Verificar si hay lecciones en la base de datos"""
    print("=" * 60)
    print("VERIFICACIÓN DE LECCIONES EN LA BASE DE DATOS")
    print("=" * 60)
    
    # Contar categorías
    categories_count = LessonCategory.objects.count()
    print(f"\n📚 Categorías encontradas: {categories_count}")
    
    if categories_count > 0:
        print("\nCategorías:")
        for cat in LessonCategory.objects.all():
            lessons_count = cat.lessons.count()
            print(f"  - {cat.name}: {lessons_count} lecciones")
    
    # Contar lecciones
    lessons_count = Lesson.objects.count()
    print(f"\n📖 Total de lecciones: {lessons_count}")
    
    if lessons_count > 0:
        print("\nLecciones:")
        for lesson in Lesson.objects.all()[:10]:  # Mostrar primeras 10
            print(f"  - {lesson.title} ({lesson.category.name})")
        
        if lessons_count > 10:
            print(f"  ... y {lessons_count - 10} más")
    
    print("\n" + "=" * 60)
    
    if categories_count == 0 or lessons_count == 0:
        print("\n⚠️  NO HAY LECCIONES EN LA BASE DE DATOS")
        print("\nPara poblar las lecciones, ejecuta:")
        print("  python manage.py populate_lessons")
        print("\n" + "=" * 60)
        return False
    else:
        print("\n✅ La base de datos tiene lecciones")
        print("=" * 60)
        return True

if __name__ == '__main__':
    has_lessons = check_lessons()
    
    if not has_lessons:
        print("\n¿Deseas poblar las lecciones ahora? (s/n): ", end='')
        response = input().strip().lower()
        
        if response == 's' or response == 'si' or response == 'yes' or response == 'y':
            print("\n🔄 Poblando lecciones...")
            from django.core.management import call_command
            call_command('populate_lessons')
            print("\n✅ Lecciones pobladas exitosamente!")
            check_lessons()
