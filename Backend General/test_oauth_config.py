#!/usr/bin/env python
"""
Script para verificar la configuración de OAuth 2.0
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
from oauth2_provider.models import Application

def check_env_variables():
    """Verificar variables de entorno"""
    print("=" * 60)
    print("VERIFICACIÓN DE VARIABLES DE ENTORNO")
    print("=" * 60)
    
    required_vars = {
        'GOOGLE_CLIENT_ID': settings.GOOGLE_CLIENT_ID,
        'GOOGLE_CLIENT_SECRET': settings.GOOGLE_CLIENT_SECRET,
        'GOOGLE_REDIRECT_URI': settings.GOOGLE_REDIRECT_URI,
    }
    
    all_ok = True
    for var_name, var_value in required_vars.items():
        if var_value:
            # Mostrar solo los primeros caracteres para seguridad
            display_value = var_value[:20] + '...' if len(var_value) > 20 else var_value
            print(f"✅ {var_name}: {display_value}")
        else:
            print(f"❌ {var_name}: NO CONFIGURADO")
            all_ok = False
    
    return all_ok

def check_oauth_application():
    """Verificar aplicación OAuth2"""
    print("\n" + "=" * 60)
    print("VERIFICACIÓN DE APLICACIÓN OAUTH2")
    print("=" * 60)
    
    apps = Application.objects.all()
    
    if not apps.exists():
        print("❌ No hay aplicaciones OAuth2 configuradas")
        print("\nPara crear una, ejecuta:")
        print("  python manage.py create_oauth_app")
        return False
    
    for app in apps:
        print(f"\n✅ Aplicación encontrada:")
        print(f"   Nombre: {app.name}")
        print(f"   Client ID: {app.client_id}")
        print(f"   Client Type: {app.client_type}")
        print(f"   Authorization Grant Type: {app.authorization_grant_type}")
        print(f"   Redirect URIs: {app.redirect_uris}")
    
    return True

def check_endpoints():
    """Verificar endpoints disponibles"""
    print("\n" + "=" * 60)
    print("ENDPOINTS DE AUTENTICACIÓN")
    print("=" * 60)
    
    endpoints = [
        ('POST', '/api/auth/token/', 'Login tradicional'),
        ('POST', '/api/auth/register/', 'Registro de usuario'),
        ('POST', '/api/auth/google/exchange-code/', 'Intercambio de código Google'),
        ('POST', '/api/auth/social/', 'Login social (GitHub, etc)'),
        ('GET', '/api/auth/profile/', 'Perfil de usuario'),
        ('POST', '/api/auth/logout/', 'Cerrar sesión'),
    ]
    
    for method, endpoint, description in endpoints:
        print(f"✅ {method:6} {endpoint:40} - {description}")

def main():
    """Función principal"""
    print("\n🔍 VERIFICACIÓN DE CONFIGURACIÓN OAUTH 2.0\n")
    
    env_ok = check_env_variables()
    app_ok = check_oauth_application()
    check_endpoints()
    
    print("\n" + "=" * 60)
    print("RESUMEN")
    print("=" * 60)
    
    if env_ok and app_ok:
        print("✅ Configuración completa y correcta")
        print("\n📝 Próximos pasos:")
        print("   1. Inicia el backend: python manage.py runserver")
        print("   2. Inicia el frontend: cd frontent_oficial && npm run dev")
        print("   3. Ve a http://localhost:3000/auth")
        print("   4. Prueba el login con Google")
    else:
        print("❌ Hay problemas en la configuración")
        if not env_ok:
            print("\n   → Configura las variables de entorno en .env")
        if not app_ok:
            print("\n   → Crea la aplicación OAuth2:")
            print("     python manage.py create_oauth_app")
    
    print("\n" + "=" * 60)

if __name__ == '__main__':
    main()
