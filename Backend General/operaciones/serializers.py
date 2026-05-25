from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Operacion
from backtesting.models import Criptoactivo

User = get_user_model()

class CriptoactivoSerializerMixin(serializers.ModelSerializer):
    """
    Serializer simple para mostrar detalles del criptoactivo en la operación
    """
    class Meta:
        model = Criptoactivo
        fields = ['id', 'symbol', 'name']

class OperacionSerializer(serializers.ModelSerializer):
    criptoactivo_details = CriptoactivoSerializerMixin(source='criptoactivo', read_only=True)
    # TEMPORALMENTE MODIFICADO: Hacer usuario opcional para testing sin autenticación
    usuario = serializers.PrimaryKeyRelatedField(required=False, allow_null=True, queryset=User.objects.all())



    class Meta:
        model = Operacion
        fields = [
            'id', 
            'usuario', 
            'criptoactivo',
            'criptoactivo_details',
            'tipo_operacion', 
            'cantidad', 
            'precio_promedio', 
            'monto_total', 
            'comision', 
            'fecha_operacion', 
            'estado', 
            'notas', 
            'created_at', 
            'updated_at'
        ]
        # TEMPORALMENTE MODIFICADO: permitir enviar usuario manualmente
        read_only_fields = ['id', 'created_at', 'updated_at']  # Antes incluía 'usuario'

    def create(self, validated_data):
        # TEMPORALMENTE MODIFICADO: Solo asignar usuario si está autenticado
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            validated_data['usuario'] = request.user
        return super().create(validated_data)
