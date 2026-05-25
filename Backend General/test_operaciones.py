import os
import django
import sys
from decimal import Decimal

# Setup Django environment
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
django.setup()

from django.contrib.auth import get_user_model
from backtesting.models import Criptoactivo
from operaciones.models import Operacion
from rest_framework.test import APIRequestFactory, force_authenticate
from operaciones.views import OperacionViewSet

User = get_user_model()

def run_test():
    print("=== Testing Operaciones Module ===")
    
    # 1. Setup Test Data
    # Get or create user
    user, created = User.objects.get_or_create(username='testuser', email='test@example.com')
    if created:
        user.set_password('password123')
        user.save()
    print(f"User for test: {user.email}")

    # Get or create crypto
    btc, created = Criptoactivo.objects.get_or_create(symbol='BTC', defaults={'name': 'Bitcoin'})
    print(f"Crypto for test: {btc.symbol}")

    factory = APIRequestFactory()
    view = OperacionViewSet.as_view({'get': 'list', 'post': 'create'})
    detail_view = OperacionViewSet.as_view({'get': 'retrieve', 'put': 'update', 'delete': 'destroy'})

    # 2. Test Create (POST)
    print("\n[POST] Creating trade...")
    data = {
        'criptoactivo': btc.id,
        'tipo_operacion': 'compra',
        'cantidad': '0.5',
        'precio_promedio': '50000.00',
        'monto_total': '25000.00',
        'fecha_operacion': '2023-01-01T12:00:00Z',
        'estado': 'completada'
    }
    request = factory.post('/api/operaciones/', data)
    force_authenticate(request, user=user)
    response = view(request)
    print(f"Status: {response.status_code}")
    if response.status_code == 201:
        print("Create success!")
        op_id = response.data['id']
    else:
        print("Create failed:", response.data)
        return

    # 3. Test List (GET)
    print("\n[GET] Listing trades...")
    request = factory.get('/api/operaciones/')
    force_authenticate(request, user=user)
    response = view(request)
    print(f"Status: {response.status_code}")
    print(f"Count: {len(response.data)}")
    
    # 4. Test Update (PUT)
    print("\n[PUT] Updating trade notes...")
    update_data = {
        'criptoactivo': btc.id,
        'tipo_operacion': 'compra',
        'cantidad': '0.5',
        'precio_promedio': '50000.00',
        'monto_total': '25000.00',
        'fecha_operacion': '2023-01-01T12:00:00Z',
        'estado': 'completada',
        'notas': 'Updated via test script'
    }
    request = factory.put(f'/api/operaciones/{op_id}/', update_data)
    force_authenticate(request, user=user)
    response = detail_view(request, pk=op_id)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        print("Update success!")
        print("New notes:", response.data['notas'])
    
    # 5. Test Delete (DELETE)
    print("\n[DELETE] Deleting trade...")
    request = factory.delete(f'/api/operaciones/{op_id}/')
    force_authenticate(request, user=user)
    response = detail_view(request, pk=op_id)
    print(f"Status: {response.status_code}")
    if response.status_code == 204:
        print("Delete success!")

    print("\n=== Test Completed Successfully ===")

if __name__ == "__main__":
    run_test()
