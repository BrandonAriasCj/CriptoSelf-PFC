#!/usr/bin/env python
"""
Script para probar la validación de usuario en autenticación con Google
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

from django.contrib.auth import get_user_model

User = get_user_model()

def test_user_validation():
    """Probar la validación de usuarios"""
    print("=" * 60)
    print("PRUEBA DE VALIDACIÓN DE USUARIO CON GOOGLE")
    print("=" * 60)
    
    # Caso 1: Usuario registrado
    print("\n📋 Caso 1: Usuario Registrado")
    print("-" * 60)
    
    test_email = "test@example.com"
    
    # Verificar si existe
    user_exists = User.objects.filter(email=test_email).exists()
    
    if user_exists:
        user = User.objects.get(email=test_email)
        print(f"✅ Usuario encontrado:")
        print(f"   Email: {user.email}")
        print(f"   Username: {user.username}")
        print(f"   Nombre: {user.first_name} {user.last_name}")
        print(f"   Verificado: {user.is_verified}")
        print(f"   Email verificado: {user.email_verified}")
        print(f"\n   Resultado esperado: ✅ Acceso concedido")
    else:
        print(f"❌ Usuario NO encontrado: {test_email}")
        print(f"   Resultado esperado: ❌ Error 404 'Usuario no registrado'")
    
    # Caso 2: Usuario NO registrado
    print("\n📋 Caso 2: Usuario NO Registrado")
    print("-" * 60)
    
    new_email = "nuevo@example.com"
    new_user_exists = User.objects.filter(email=new_email).exists()
    
    if new_user_exists:
        print(f"⚠️  Usuario encontrado: {new_email}")
        print(f"   (Este caso debería ser un usuario NO registrado)")
    else:
        print(f"✅ Usuario NO encontrado: {new_email}")
        print(f"   Resultado esperado: ❌ Error 404 'Usuario no registrado'")
    
    # Resumen
    print("\n" + "=" * 60)
    print("RESUMEN DE COMPORTAMIENTO")
    print("=" * 60)
    
    print("\n✅ Usuario Registrado:")
    print("   1. Backend busca el email en la base de datos")
    print("   2. Usuario encontrado → Actualiza información")
    print("   3. Genera token OAuth2")
    print("   4. Retorna token y datos del usuario")
    print("   5. Frontend guarda token y redirige a /trading")
    
    print("\n❌ Usuario NO Registrado:")
    print("   1. Backend busca el email en la base de datos")
    print("   2. Usuario NO encontrado → Retorna error 404")
    print("   3. Mensaje: 'Usuario no registrado'")
    print("   4. Frontend muestra toast con mensaje")
    print("   5. Usuario permanece en /auth para registrarse")
    
    # Crear usuario de prueba si no existe
    print("\n" + "=" * 60)
    print("CREAR USUARIO DE PRUEBA")
    print("=" * 60)
    
    if not user_exists:
        print(f"\n¿Deseas crear un usuario de prueba con email {test_email}?")
        print("Esto te permitirá probar el flujo completo.")
        response = input("Crear usuario? (s/n): ").lower().strip()
        
        if response == 's':
            try:
                user = User.objects.create_user(
                    username='testuser',
                    email=test_email,
                    password='testpass123',
                    first_name='Test',
                    last_name='User'
                )
                print(f"\n✅ Usuario creado exitosamente:")
                print(f"   Email: {user.email}")
                print(f"   Username: {user.username}")
                print(f"   Password: testpass123")
                print(f"\n   Ahora puedes probar el login con Google usando este email.")
            except Exception as e:
                print(f"\n❌ Error creando usuario: {str(e)}")
        else:
            print("\n   Usuario no creado.")
    
    print("\n" + "=" * 60)
    print("INSTRUCCIONES DE PRUEBA")
    print("=" * 60)
    
    print("\n1. Inicia el backend:")
    print("   python manage.py runserver")
    
    print("\n2. Inicia el frontend:")
    print("   cd frontent_oficial && npm run dev")
    
    print("\n3. Ve a http://localhost:3000/auth")
    
    print("\n4. Click en 'Continuar con Google'")
    
    print("\n5. Usa una cuenta de Google con email:")
    if user_exists:
        print(f"   ✅ {test_email} (registrado) → Debería funcionar")
    else:
        print(f"   ❌ {test_email} (NO registrado) → Debería mostrar error")
    
    print(f"\n   ❌ {new_email} (NO registrado) → Debería mostrar error")
    
    print("\n6. Verifica los logs:")
    print("   - Console del navegador (F12)")
    print("   - Terminal del backend")
    
    print("\n" + "=" * 60)

if __name__ == '__main__':
    test_user_validation()
