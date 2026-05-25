#!/usr/bin/env python
"""
Script para probar la actualización de perfil
"""
import requests
import json

# Configuración
BASE_URL = "http://localhost:8000"

def test_profile_update():
    print("=" * 60)
    print("PRUEBA DE ACTUALIZACIÓN DE PERFIL")
    print("=" * 60)
    
    # 1. Obtener token (necesitas tener un usuario registrado)
    print("\n1. Obteniendo token...")
    print("   Nota: Necesitas tener un usuario registrado")
    print("   Puedes obtener el token desde localStorage en el navegador")
    
    token = input("\n   Ingresa tu access_token: ").strip()
    
    if not token:
        print("   ❌ Token no proporcionado")
        return
    
    # 2. Probar GET /api/auth/profile/
    print("\n2. Probando GET /api/auth/profile/...")
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    try:
        response = requests.get(f"{BASE_URL}/api/auth/profile/", headers=headers)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            print("   ✅ GET exitoso")
            user_data = response.json()
            print(f"   Usuario: {user_data.get('username')}")
            print(f"   Email: {user_data.get('email')}")
            print(f"   Nombre: {user_data.get('first_name')} {user_data.get('last_name')}")
        else:
            print(f"   ❌ Error: {response.text}")
            return
    except Exception as e:
        print(f"   ❌ Error de conexión: {str(e)}")
        return
    
    # 3. Probar PATCH /api/auth/profile/
    print("\n3. Probando PATCH /api/auth/profile/...")
    
    update_data = {
        'first_name': 'Test',
        'last_name': 'Update',
        'phone_number': '+1234567890'
    }
    
    print(f"   Datos a enviar: {json.dumps(update_data, indent=2)}")
    
    try:
        response = requests.patch(
            f"{BASE_URL}/api/auth/profile/",
            headers=headers,
            json=update_data
        )
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            print("   ✅ PATCH exitoso")
            updated_user = response.json()
            print(f"   Usuario actualizado:")
            print(f"   - Nombre: {updated_user.get('first_name')} {updated_user.get('last_name')}")
            print(f"   - Teléfono: {updated_user.get('phone_number')}")
        else:
            print(f"   ❌ Error: {response.text}")
    except Exception as e:
        print(f"   ❌ Error de conexión: {str(e)}")
    
    print("\n" + "=" * 60)

if __name__ == '__main__':
    test_profile_update()
