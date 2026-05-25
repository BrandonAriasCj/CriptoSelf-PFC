#!/usr/bin/env python
"""
Script para verificar la configuración completa de la Academia
"""
import os
import sys
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.conf import settings
from lessons.models import LessonCategory, Lesson, Quiz

def print_section(title):
    """Imprimir sección con formato"""
    print("\n" + "=" * 70)
    print(f"  {title}")
    print("=" * 70)

def check_installed_apps():
    """Verificar que lessons esté en INSTALLED_APPS"""
    print_section("1. VERIFICACIÓN DE INSTALLED_APPS")
    
    if 'lessons' in settings.INSTALLED_APPS:
        print("✅ 'lessons' está en INSTALLED_APPS")
        return True
    else:
        print("❌ 'lessons' NO está en INSTALLED_APPS")
        print("\nAgrega 'lessons' a INSTALLED_APPS en backend/settings.py:")
        print("  INSTALLED_APPS = [")
        print("      ...,")
        print("      'lessons',")
        print("  ]")
        return False

def check_database():
    """Verificar tablas en la base de datos"""
    print_section("2. VERIFICACIÓN DE BASE DE DATOS")
    
    try:
        # Intentar hacer una query simple
        categories_count = LessonCategory.objects.count()
        lessons_count = Lesson.objects.count()
        quizzes_count = Quiz.objects.count()
        
        print(f"✅ Tablas de lessons existen")
        print(f"   - Categorías: {categories_count}")
        print(f"   - Lecciones: {lessons_count}")
        print(f"   - Quizzes: {quizzes_count}")
        
        if categories_count == 0 or lessons_count == 0:
            print("\n⚠️  Las tablas existen pero están vacías")
            print("   Ejecuta: python manage.py populate_lessons")
            return False
        
        return True
    except Exception as e:
        print(f"❌ Error al acceder a las tablas: {e}")
        print("\nPosibles soluciones:")
        print("  1. Ejecuta: python manage.py makemigrations lessons")
        print("  2. Ejecuta: python manage.py migrate lessons")
        return False

def check_urls():
    """Verificar configuración de URLs"""
    print_section("3. VERIFICACIÓN DE URLs")
    
    try:
        from django.urls import resolve
        from django.urls.exceptions import Resolver404
        
        # Intentar resolver las URLs principales
        urls_to_check = [
            '/api/lessons/categories/',
            '/api/lessons/progress/summary/',
        ]
        
        all_ok = True
        for url in urls_to_check:
            try:
                resolve(url)
                print(f"✅ {url}")
            except Resolver404:
                print(f"❌ {url} - No encontrada")
                all_ok = False
        
        if not all_ok:
            print("\n⚠️  Algunas URLs no están configuradas")
            print("   Verifica que backend/urls.py incluya:")
            print("   path('api/lessons/', include('lessons.urls')),")
        
        return all_ok
    except Exception as e:
        print(f"❌ Error al verificar URLs: {e}")
        return False

def check_permissions():
    """Verificar permisos de las vistas"""
    print_section("4. VERIFICACIÓN DE PERMISOS")
    
    from lessons.views import LessonCategoryListView, LessonsByCategoryView
    
    # Verificar que las vistas permitan acceso sin autenticación
    cat_perms = LessonCategoryListView.permission_classes
    lessons_perms = LessonsByCategoryView.permission_classes
    
    if cat_perms == [] and lessons_perms == []:
        print("✅ Las vistas permiten acceso sin autenticación")
        return True
    else:
        print("⚠️  Las vistas requieren autenticación")
        print(f"   LessonCategoryListView: {cat_perms}")
        print(f"   LessonsByCategoryView: {lessons_perms}")
        print("\n   Para permitir acceso sin auth, establece:")
        print("   permission_classes = []")
        return False

def check_cors():
    """Verificar configuración de CORS"""
    print_section("5. VERIFICACIÓN DE CORS")
    
    if 'corsheaders' in settings.INSTALLED_APPS:
        print("✅ corsheaders está instalado")
        
        if hasattr(settings, 'CORS_ALLOWED_ORIGINS'):
            print(f"✅ CORS_ALLOWED_ORIGINS configurado:")
            for origin in settings.CORS_ALLOWED_ORIGINS:
                print(f"   - {origin}")
        elif hasattr(settings, 'CORS_ALLOW_ALL_ORIGINS') and settings.CORS_ALLOW_ALL_ORIGINS:
            print("⚠️  CORS_ALLOW_ALL_ORIGINS=True (no recomendado en producción)")
        else:
            print("❌ CORS no está configurado correctamente")
            return False
        
        return True
    else:
        print("❌ corsheaders NO está instalado")
        print("\nInstala con: pip install django-cors-headers")
        return False

def show_sample_data():
    """Mostrar datos de ejemplo"""
    print_section("6. DATOS DE EJEMPLO")
    
    categories = LessonCategory.objects.all()[:3]
    if categories:
        print("\nCategorías:")
        for cat in categories:
            lessons = cat.lessons.all()[:2]
            print(f"\n  📚 {cat.name}")
            print(f"     {cat.description}")
            print(f"     Lecciones: {cat.lessons.count()}")
            
            if lessons:
                for lesson in lessons:
                    print(f"       - {lesson.title}")
    else:
        print("⚠️  No hay categorías en la base de datos")

def main():
    """Función principal"""
    print("\n" + "🔍 " * 20)
    print("  VERIFICACIÓN COMPLETA DE LA ACADEMIA")
    print("🔍 " * 20)
    
    checks = [
        check_installed_apps(),
        check_database(),
        check_urls(),
        check_permissions(),
        check_cors()
    ]
    
    show_sample_data()
    
    print_section("RESUMEN")
    
    passed = sum(checks)
    total = len(checks)
    
    print(f"\nVerificaciones pasadas: {passed}/{total}")
    
    if passed == total:
        print("\n✅ ¡Todo está configurado correctamente!")
        print("\nSi aún no ves las lecciones en el frontend:")
        print("  1. Verifica que el frontend esté apuntando a la URL correcta")
        print("  2. Revisa la consola del navegador (F12) para errores")
        print("  3. Verifica que el servidor backend esté corriendo")
    else:
        print("\n⚠️  Hay problemas que necesitan ser resueltos")
        print("   Revisa las secciones marcadas con ❌ arriba")
    
    print("\n" + "=" * 70 + "\n")

if __name__ == '__main__':
    main()
