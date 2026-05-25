#!/usr/bin/env python
"""
Script para verificar la configuración de CORS
"""
import os
import sys
from pathlib import Path

# Agregar el directorio del proyecto al path
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
import django
django.setup()

from django.conf import settings

def verificar_cors():
    print("=" * 60)
    print("VERIFICACIÓN DE CONFIGURACIÓN CORS")
    print("=" * 60)
    
    # Verificar que corsheaders esté instalado
    print("\n1. Verificando INSTALLED_APPS...")
    if 'corsheaders' in settings.INSTALLED_APPS:
        print("   ✅ corsheaders está en INSTALLED_APPS")
    else:
        print("   ❌ corsheaders NO está en INSTALLED_APPS")
        return
    
    # Verificar middleware
    print("\n2. Verificando MIDDLEWARE...")
    if 'corsheaders.middleware.CorsMiddleware' in settings.MIDDLEWARE:
        index = settings.MIDDLEWARE.index('corsheaders.middleware.CorsMiddleware')
        print(f"   ✅ CorsMiddleware está en MIDDLEWARE (posición {index})")
        if index == 0:
            print("   ✅ CorsMiddleware está en la primera posición (correcto)")
        else:
            print(f"   ⚠️  CorsMiddleware debería estar en la primera posición")
    else:
        print("   ❌ CorsMiddleware NO está en MIDDLEWARE")
        return
    
    # Verificar CORS_ALLOWED_ORIGINS
    print("\n3. Verificando CORS_ALLOWED_ORIGINS...")
    if hasattr(settings, 'CORS_ALLOWED_ORIGINS'):
        print(f"   ✅ CORS_ALLOWED_ORIGINS configurado:")
        for origin in settings.CORS_ALLOWED_ORIGINS:
            print(f"      - {origin}")
    else:
        print("   ❌ CORS_ALLOWED_ORIGINS NO está configurado")
    
    # Verificar CORS_ALLOW_CREDENTIALS
    print("\n4. Verificando CORS_ALLOW_CREDENTIALS...")
    if hasattr(settings, 'CORS_ALLOW_CREDENTIALS'):
        print(f"   ✅ CORS_ALLOW_CREDENTIALS = {settings.CORS_ALLOW_CREDENTIALS}")
    else:
        print("   ❌ CORS_ALLOW_CREDENTIALS NO está configurado")
    
    # Verificar CORS_ALLOW_METHODS
    print("\n5. Verificando CORS_ALLOW_METHODS...")
    if hasattr(settings, 'CORS_ALLOW_METHODS'):
        print(f"   ✅ CORS_ALLOW_METHODS configurado:")
        for method in settings.CORS_ALLOW_METHODS:
            print(f"      - {method}")
        if 'PATCH' in settings.CORS_ALLOW_METHODS:
            print("   ✅ PATCH está permitido")
        else:
            print("   ❌ PATCH NO está permitido")
    else:
        print("   ⚠️  CORS_ALLOW_METHODS NO está configurado (usando defaults)")
    
    # Verificar CORS_ALLOW_HEADERS
    print("\n6. Verificando CORS_ALLOW_HEADERS...")
    if hasattr(settings, 'CORS_ALLOW_HEADERS'):
        print(f"   ✅ CORS_ALLOW_HEADERS configurado:")
        important_headers = ['authorization', 'content-type']
        for header in important_headers:
            if header in settings.CORS_ALLOW_HEADERS:
                print(f"      ✅ {header}")
            else:
                print(f"      ❌ {header} NO está permitido")
    else:
        print("   ⚠️  CORS_ALLOW_HEADERS NO está configurado (usando defaults)")
    
    print("\n" + "=" * 60)
    print("RESUMEN")
    print("=" * 60)
    
    all_ok = True
    
    if 'corsheaders' not in settings.INSTALLED_APPS:
        print("❌ Falta corsheaders en INSTALLED_APPS")
        all_ok = False
    
    if 'corsheaders.middleware.CorsMiddleware' not in settings.MIDDLEWARE:
        print("❌ Falta CorsMiddleware en MIDDLEWARE")
        all_ok = False
    
    if not hasattr(settings, 'CORS_ALLOWED_ORIGINS'):
        print("❌ Falta CORS_ALLOWED_ORIGINS")
        all_ok = False
    
    if not hasattr(settings, 'CORS_ALLOW_METHODS') or 'PATCH' not in settings.CORS_ALLOW_METHODS:
        print("❌ PATCH no está permitido en CORS_ALLOW_METHODS")
        all_ok = False
    
    if all_ok:
        print("\n✅ Configuración de CORS correcta")
        print("\nSi aún tienes problemas:")
        print("1. Reinicia el servidor Django (Ctrl+C y python manage.py runserver)")
        print("2. Limpia el caché del navegador (Ctrl+Shift+R)")
        print("3. Verifica que el servidor esté corriendo en puerto 8000")
    else:
        print("\n❌ Hay problemas en la configuración de CORS")
        print("Revisa backend/settings.py")
    
    print("\n" + "=" * 60)

if __name__ == '__main__':
    verificar_cors()
