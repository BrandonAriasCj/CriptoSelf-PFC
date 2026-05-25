from rest_framework import permissions
from oauth2_provider.contrib.rest_framework import TokenHasScope as _TokenHasScope


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Permiso personalizado para permitir solo a los propietarios editar sus objetos
    """
    def has_object_permission(self, request, view, obj):
        # Permisos de lectura para cualquier request
        if request.method in permissions.SAFE_METHODS:
            return True

        # Permisos de escritura solo para el propietario del objeto
        return obj == request.user


class HasRequiredScope(_TokenHasScope):
    """
    Permiso que verifica scopes específicos basado en el método HTTP
    """
    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False

        # Definir scopes requeridos por método
        method_scopes = {
            'GET': ['read'],
            'POST': ['write'],
            'PUT': ['write'],
            'PATCH': ['write'],
            'DELETE': ['write'],
        }

        required_scopes = method_scopes.get(request.method, [])
        token = request.auth

        if not token:
            return False

        token_scopes = token.scope.split()
        return any(scope in token_scopes for scope in required_scopes)


class IsVerifiedUser(permissions.BasePermission):
    """
    Permiso que requiere que el usuario esté verificado
    """
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.is_verified
        )


class IsCompanyUser(permissions.BasePermission):
    """
    Permiso que requiere que el usuario tenga perfil de tipo 'company'.
    Se combina siempre con TokenHasScope para garantizar autenticación OAuth2.
    """
    message = 'Este endpoint es exclusivo para cuentas de empresa.'

    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.profile_type == 'company'
        )


class IsOrganizationAdmin(permissions.BasePermission):
    """
    Requiere que el usuario sea administrador de al menos una organización.
    """
    message = 'Debes ser administrador de una organización para acceder a este recurso.'

    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            hasattr(request.user, 'organization_admin')
        )