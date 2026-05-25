from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    Criptoactivo,
    Indicador,
    Evento,
    Estrategia,
    UsuarioEstrategiaCriptoactivo,
    DetalleEstrategia,
    EventoEstrategiaDetalle,
    IndicadorEvento,
)

User = get_user_model()


class CriptoactivoSerializer(serializers.ModelSerializer):
    """
    Serializer para el modelo Criptoactivo
    """
    class Meta:
        model = Criptoactivo
        fields = [
            'id', 'symbol', 'name', 'description', 'market_cap_rank',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_symbol(self, value):
        """Validar que el símbolo esté en mayúsculas"""
        return value.upper()


class IndicadorSerializer(serializers.ModelSerializer):
    """
    Serializer para el modelo Indicador
    """
    class Meta:
        model = Indicador
        fields = [
            'id', 'name', 'code', 'tipo', 'description', 'parameters_schema',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_code(self, value):
        """Validar que el código esté en mayúsculas"""
        return value.upper()


class EventoSerializer(serializers.ModelSerializer):
    """
    Serializer para el modelo Evento
    """
    class Meta:
        model = Evento
        fields = [
            'id', 'name', 'code', 'tipo_evento', 'description', 'condition_logic',
            'priority', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_code(self, value):
        """Validar que el código esté en mayúsculas"""
        return value.upper()

    def validate_priority(self, value):
        """Validar que la prioridad esté entre 1 y 10"""
        if not 1 <= value <= 10:
            raise serializers.ValidationError("La prioridad debe estar entre 1 y 10")
        return value


class EstrategiaSerializer(serializers.ModelSerializer):
    """
    Serializer para el modelo Estrategia
    """
    created_by_email = serializers.CharField(source='created_by.email', read_only=True)
    
    class Meta:
        model = Estrategia
        fields = [
            'id', 'name', 'code', 'description', 'tipo_estrategia', 'estado',
            'max_risk_per_trade', 'max_drawdown', 'timeframe', 'is_public',
            'created_by', 'created_by_email', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']

    def validate_code(self, value):
        """Validar que el código esté en mayúsculas y sin espacios"""
        return value.upper().replace(' ', '_')

    def validate_max_risk_per_trade(self, value):
        """Validar que el riesgo máximo por operación esté entre 0.01% y 100%"""
        if not 0.01 <= float(value) <= 100.00:
            raise serializers.ValidationError("El riesgo máximo por operación debe estar entre 0.01% y 100%")
        return value

    def validate_max_drawdown(self, value):
        """Validar que el drawdown máximo esté entre 0.01% y 100%"""
        if not 0.01 <= float(value) <= 100.00:
            raise serializers.ValidationError("El drawdown máximo debe estar entre 0.01% y 100%")
        return value


class UsuarioEstrategiaCriptoactivoSerializer(serializers.ModelSerializer):
    """
    Serializer para el modelo UsuarioEstrategiaCriptoactivo
    """
    usuario_email = serializers.CharField(source='usuario.email', read_only=True)
    estrategia_name = serializers.CharField(source='estrategia.name', read_only=True)
    estrategia_code = serializers.CharField(source='estrategia.code', read_only=True)
    criptoactivo_symbol = serializers.CharField(source='criptoactivo.symbol', read_only=True)
    criptoactivo_name = serializers.CharField(source='criptoactivo.name', read_only=True)
    
    class Meta:
        model = UsuarioEstrategiaCriptoactivo
        fields = [
            'id', 'usuario', 'usuario_email', 'estrategia', 'estrategia_name', 
            'estrategia_code', 'criptoactivo', 'criptoactivo_symbol', 'criptoactivo_name',
            'estado', 'capital_asignado', 'custom_risk_per_trade', 'fecha_inicio', 
            'fecha_fin', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_capital_asignado(self, value):
        """Validar que el capital asignado sea positivo"""
        if value < 0:
            raise serializers.ValidationError("El capital asignado debe ser positivo")
        return value

    def validate_custom_risk_per_trade(self, value):
        """Validar que el riesgo personalizado esté entre 0.01% y 100%"""
        if value is not None and not 0.01 <= float(value) <= 100.00:
            raise serializers.ValidationError("El riesgo personalizado debe estar entre 0.01% y 100%")
        return value

    def validate(self, data):
        """Validar que la fecha de fin sea posterior a la fecha de inicio"""
        fecha_inicio = data.get('fecha_inicio')
        fecha_fin = data.get('fecha_fin')
        
        if fecha_inicio and fecha_fin and fecha_fin <= fecha_inicio:
            raise serializers.ValidationError("La fecha de fin debe ser posterior a la fecha de inicio")
        
        return data


class DetalleEstrategiaSerializer(serializers.ModelSerializer):
    """
    Serializer para el modelo DetalleEstrategia
    """
    estrategia_name = serializers.CharField(source='estrategia.name', read_only=True)
    estrategia_code = serializers.CharField(source='estrategia.code', read_only=True)
    
    class Meta:
        model = DetalleEstrategia
        fields = [
            'id', 'estrategia', 'estrategia_name', 'estrategia_code', 'tipo_detalle',
            'name', 'description', 'configuration', 'order', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_order(self, value):
        """Validar que el orden sea positivo"""
        if value < 1:
            raise serializers.ValidationError("El orden debe ser un número positivo")
        return value


class EventoEstrategiaDetalleSerializer(serializers.ModelSerializer):
    """
    Serializer para el modelo EventoEstrategiaDetalle
    """
    evento_name = serializers.CharField(source='evento.name', read_only=True)
    evento_code = serializers.CharField(source='evento.code', read_only=True)
    detalle_estrategia_name = serializers.CharField(source='detalle_estrategia.name', read_only=True)
    estrategia_name = serializers.CharField(source='detalle_estrategia.estrategia.name', read_only=True)
    
    class Meta:
        model = EventoEstrategiaDetalle
        fields = [
            'id', 'evento', 'evento_name', 'evento_code', 'detalle_estrategia',
            'detalle_estrategia_name', 'estrategia_name', 'parameters', 'weight',
            'evaluation_order', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_weight(self, value):
        """Validar que el peso esté entre 0.01 y 10.00"""
        if not 0.01 <= float(value) <= 10.00:
            raise serializers.ValidationError("El peso debe estar entre 0.01 y 10.00")
        return value

    def validate_evaluation_order(self, value):
        """Validar que el orden de evaluación sea positivo"""
        if value < 1:
            raise serializers.ValidationError("El orden de evaluación debe ser un número positivo")
        return value


# Serializers adicionales para casos específicos

class EstrategiaListSerializer(serializers.ModelSerializer):
    """
    Serializer simplificado para listar estrategias
    """
    created_by_email = serializers.CharField(source='created_by.email', read_only=True)
    
    class Meta:
        model = Estrategia
        fields = [
            'id', 'name', 'code', 'tipo_estrategia', 'estado', 'timeframe',
            'is_public', 'created_by_email', 'created_at'
        ]


class CriptoactivoListSerializer(serializers.ModelSerializer):
    """
    Serializer simplificado para listar criptoactivos
    """
    class Meta:
        model = Criptoactivo
        fields = ['id', 'symbol', 'name', 'market_cap_rank', 'is_active']


class IndicadorListSerializer(serializers.ModelSerializer):
    """
    Serializer simplificado para listar indicadores
    """
    class Meta:
        model = Indicador
        fields = ['id', 'name', 'code', 'tipo', 'is_active']


class EventoListSerializer(serializers.ModelSerializer):
    """
    Serializer simplificado para listar eventos
    """
    class Meta:
        model = Evento
        fields = ['id', 'name', 'code', 'tipo_evento', 'priority', 'is_active']


class IndicadorEventoSerializer(serializers.ModelSerializer):
    """
    Serializer para el modelo IndicadorEvento
    """
    indicador_name = serializers.CharField(source='indicador.name', read_only=True)
    indicador_code = serializers.CharField(source='indicador.code', read_only=True)
    evento_name = serializers.CharField(source='evento.name', read_only=True)
    evento_code = serializers.CharField(source='evento.code', read_only=True)
    
    class Meta:
        model = IndicadorEvento
        fields = [
            'id', 'indicador', 'indicador_name', 'indicador_code', 'evento',
            'evento_name', 'evento_code', 'parameters', 'threshold_value',
            'comparison_operator', 'weight', 'evaluation_order', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_weight(self, value):
        """Validar que el peso esté entre 0.01 y 10.00"""
        if not 0.01 <= float(value) <= 10.00:
            raise serializers.ValidationError("El peso debe estar entre 0.01 y 10.00")
        return value

    def validate_evaluation_order(self, value):
        """Validar que el orden de evaluación sea positivo"""
        if value < 1:
            raise serializers.ValidationError("El orden de evaluación debe ser un número positivo")
        return value

    def validate_threshold_value(self, value):
        """Validar que el valor umbral sea válido cuando se proporciona"""
        if value is not None and value < 0:
            raise serializers.ValidationError("El valor umbral no puede ser negativo")
        return value