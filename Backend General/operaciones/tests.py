from django.test import TestCase
from django.contrib.auth import get_user_model
from decimal import Decimal
from .models import Operacion
from backtesting.models import Criptoactivo

User = get_user_model()


class OperacionModelTest(TestCase):
    """
    Tests básicos para el modelo Operacion.
    TODO: Expandir con tests más completos.
    """
    
    def setUp(self):
        """Configuración inicial para los tests"""
        self.user, created = User.objects.get_or_create(
            username='testuser_ops',
            defaults={
                'email': 'testops@example.com',
            }
        )
        if created:
            self.user.set_password('testpass123')
            self.user.save()
        
        self.crypto, _ = Criptoactivo.objects.get_or_create(
            symbol='BTC',
            defaults={'name': 'Bitcoin'}
        )
    
    def test_crear_operacion_compra(self):
        """Test de creación de operación de compra"""
        operacion = Operacion.objects.create(
            usuario=self.user,
            criptoactivo=self.crypto,
            tipo_operacion='compra',
            cantidad=Decimal('0.5'),
            precio_promedio=Decimal('50000.00'),
            monto_total=Decimal('25000.00'),
            fecha_operacion='2023-01-01T12:00:00Z',
            estado='completada'
        )
        self.assertEqual(operacion.tipo_operacion, 'compra')
        self.assertEqual(operacion.cantidad, Decimal('0.5'))
        self.assertEqual(operacion.usuario, self.user)
    
    def test_operacion_str(self):
        """Test del método __str__ del modelo"""
        operacion = Operacion.objects.create(
            usuario=self.user,
            criptoactivo=self.crypto,
            tipo_operacion='venta',
            cantidad=Decimal('1.0'),
            precio_promedio=Decimal('60000.00'),
            monto_total=Decimal('60000.00'),
            fecha_operacion='2023-01-01T12:00:00Z',
        )
        expected = f"Venta {self.crypto.symbol} - {operacion.cantidad}"
        self.assertEqual(str(operacion), expected)
