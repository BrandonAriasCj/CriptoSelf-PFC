from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.mail import send_mail
from django.conf import settings
from oauth2_provider.models import Application, AccessToken
from oauth2_provider.contrib.rest_framework import TokenHasScope
from users.serializers import (
    UserSerializer, UserCreateSerializer, UserUpdateSerializer,
    ChangePasswordSerializer, CompanyUserUpdateSerializer
)
import requests

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    """
    Registro de nuevos usuarios (Perfil Usuario Web)
    """
    queryset = User.objects.all()
    serializer_class = UserCreateSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        return Response({
            'message': 'Usuario creado exitosamente',
            'user': UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)


class RegisterCompanyView(generics.CreateAPIView):
    """
    Registro de usuarios tipo Empresa Web.
    Crea el User con profile_type='company' y un CompanyProfile inicial.
    Body extra aceptado: company_name (requerido), industry, company_size,
                         tax_id, company_country, company_city
    """
    queryset = User.objects.all()
    serializer_class = UserCreateSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        from users.models import CompanyProfile

        # Validar datos del usuario
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            # Aplanar todos los errores de campo en un mensaje legible
            errors = serializer.errors
            messages = []
            for field, msgs in errors.items():
                if isinstance(msgs, list):
                    for m in msgs:
                        messages.append(f"{field}: {m}")
                else:
                    messages.append(f"{field}: {msgs}")
            return Response(
                {'error': ' | '.join(messages), 'details': errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validar company_name
        if not request.data.get('company_name'):
            return Response(
                {'error': 'El nombre de la empresa (company_name) es requerido.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = serializer.save()

        # Marcar como empresa ANTES de guardar para que el signal lo detecte
        user.profile_type = 'company'
        user.save(update_fields=['profile_type'])

        # Recoger campos corporativos del body
        company_fields = [
            'company_name', 'tax_id', 'industry', 'company_size',
            'company_website', 'company_address', 'company_country', 'company_city'
        ]
        company_data = {
            k: request.data[k]
            for k in company_fields
            if k in request.data and request.data[k]
        }
        if 'company_name' not in company_data:
            company_data['company_name'] = user.email

        # update_or_create para ser idempotente frente al signal
        CompanyProfile.objects.update_or_create(
            user=user,
            defaults=company_data
        )

        # Refrescar desde DB para que la respuesta refleje los datos guardados
        user.refresh_from_db()

        return Response({
            'message': 'Cuenta de empresa creada exitosamente',
            'user': UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)


class ProfileView(generics.RetrieveUpdateAPIView):
    """
    Ver y actualizar perfil del usuario autenticado (Perfil Usuario Web)
    """
    serializer_class = UserUpdateSerializer
    permission_classes = [TokenHasScope]
    required_scopes = ['read']

    def get_object(self):
        return self.request.user

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return UserSerializer
        return UserUpdateSerializer

    def update(self, request, *args, **kwargs):
        """Override update to handle partial updates"""
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.required_scopes = ['write']
        self.perform_update(serializer)
        return Response(UserSerializer(instance).data)


class CompanyProfileView(generics.RetrieveUpdateAPIView):
    """
    Ver y actualizar perfil de empresa del usuario autenticado.
    GET  → devuelve User + company_profile anidado
    PUT/PATCH → actualiza datos personales + datos corporativos en un solo request
    """
    permission_classes = [TokenHasScope]
    required_scopes = ['read']

    def get_object(self):
        return self.request.user

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return UserSerializer
        return CompanyUserUpdateSerializer

    def get(self, request, *args, **kwargs):
        """Devuelve perfil completo con datos de empresa"""
        user = self.get_object()
        if user.profile_type != 'company':
            return Response(
                {'error': 'Este endpoint es exclusivo para perfiles de empresa.'},
                status=status.HTTP_403_FORBIDDEN
            )
        serializer = UserSerializer(user, context={'request': request})
        return Response(serializer.data)

    def update(self, request, *args, **kwargs):
        """Actualiza datos personales y corporativos del usuario empresa"""
        instance = self.get_object()
        if instance.profile_type != 'company':
            return Response(
                {'error': 'Este endpoint es exclusivo para perfiles de empresa.'},
                status=status.HTTP_403_FORBIDDEN
            )
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.required_scopes = ['write']
        self.perform_update(serializer)
        return Response(
            UserSerializer(instance, context={'request': request}).data
        )


class ChangePasswordView(APIView):
    """
    Cambiar contraseña del usuario autenticado
    """
    permission_classes = [TokenHasScope]
    required_scopes = ['write']

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        if serializer.is_valid():
            user = request.user
            
            # Verificar contraseña actual
            if not user.check_password(serializer.validated_data['old_password']):
                return Response({
                    'error': 'Contraseña actual incorrecta'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Cambiar contraseña
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            
            return Response({
                'message': 'Contraseña cambiada exitosamente'
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def oauth_token(request):
    """
    Obtener token OAuth2 usando credenciales
    """
    # Debug: imprimir datos recibidos
    print("=== DEBUG LOGIN ===")
    print(f"Request data: {request.data}")
    print(f"Content-Type: {request.content_type}")
    
    username = request.data.get('username')
    password = request.data.get('password')
    client_id = request.data.get('client_id')
    client_secret = request.data.get('client_secret')
    
    print(f"Username: {username}")
    print(f"Password: {'*' * len(password) if password else None}")
    print(f"Client ID: {client_id}")
    print(f"Client Secret: {'*' * 10 if client_secret else None}")
    
    if not all([username, password, client_id, client_secret]):
        missing = []
        if not username: missing.append('username')
        if not password: missing.append('password')
        if not client_id: missing.append('client_id')
        if not client_secret: missing.append('client_secret')
        
        return Response({
            'error': f'Faltan parámetros requeridos: {", ".join(missing)}'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Verificar aplicación OAuth2
        print(f"Buscando aplicación con client_id: {client_id}")
        application = Application.objects.get(client_id=client_id)
        print(f"Aplicación encontrada: {application.name}")
        
        if application.client_secret != client_secret:
            print("Client secret no coincide")
            return Response({
                'error': 'Client secret inválido'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Autenticar usuario
        print(f"Autenticando usuario: {username}")
        user = authenticate(username=username, password=password)
        print(f"Usuario autenticado: {user}")
        
        if not user:
            return Response({
                'error': 'Credenciales inválidas'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Usar Django OAuth Toolkit directamente
        from oauth2_provider.models import AccessToken
        from django.conf import settings
        from datetime import datetime, timedelta
        import secrets
        
        from django.utils import timezone
        
        # Obtener configuración de OAuth2
        oauth2_config = getattr(settings, 'OAUTH2_PROVIDER', {})
        expires_seconds = oauth2_config.get('ACCESS_TOKEN_EXPIRE_SECONDS', 3600)
        
        # Crear token manualmente
        access_token = AccessToken.objects.create(
            user=user,
            application=application,
            token=secrets.token_urlsafe(30),
            expires=timezone.now() + timedelta(seconds=expires_seconds),
            scope='read write'
        )
        
        return Response({
            'access_token': access_token.token,
            'token_type': 'Bearer',
            'expires_in': expires_seconds,
            'scope': 'read write',
            'user': UserSerializer(user).data
        })
            
    except Application.DoesNotExist:
        print("Aplicación OAuth2 no encontrada")
        return Response({
            'error': 'Aplicación OAuth2 no válida'
        }, status=status.HTTP_401_UNAUTHORIZED)
    except Exception as e:
        print(f"Error inesperado: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([TokenHasScope])
def logout(request):
    """
    Cerrar sesión revocando el token
    """
    required_scopes = ['write']
    
    try:
        token = request.auth
        token.delete()
        return Response({
            'message': 'Sesión cerrada exitosamente'
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            'error': 'Error al cerrar sesión'
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([TokenHasScope])
def user_info(request):
    """
    Información del usuario autenticado
    """
    required_scopes = ['read']
    
    return Response({
        'user': UserSerializer(request.user).data,
        'scopes': request.auth.scope.split() if request.auth else []
    })


class SocialAuthView(APIView):
    """
    Autenticación con proveedores sociales (Google, GitHub, etc.)
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        provider = request.data.get('provider')
        access_token = request.data.get('access_token')
        
        if not provider or not access_token:
            return Response({
                'error': 'Provider y access_token son requeridos'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Obtener información del usuario desde el proveedor
            user_info = self.get_user_info_from_provider(provider, access_token)
            
            if not user_info:
                return Response({
                    'error': 'No se pudo obtener información del usuario'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Buscar o crear usuario
            user = self.get_or_create_user(user_info, provider)
            
            # Crear token OAuth2
            from oauth2_provider.models import Application, AccessToken
            from django.conf import settings
            from datetime import datetime, timedelta
            import secrets
            
            # Obtener la aplicación OAuth2
            try:
                application = Application.objects.get(
                    client_id=settings.OAUTH2_PROVIDER.get('CLIENT_ID', 'default-client-id')
                )
            except Application.DoesNotExist:
                # Usar la primera aplicación disponible
                application = Application.objects.first()
                if not application:
                    return Response({
                        'error': 'No hay aplicaciones OAuth2 configuradas'
                    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            # Crear token
            oauth2_config = getattr(settings, 'OAUTH2_PROVIDER', {})
            expires_seconds = oauth2_config.get('ACCESS_TOKEN_EXPIRE_SECONDS', 3600)
            
            from django.utils import timezone
            
            access_token_obj = AccessToken.objects.create(
                user=user,
                application=application,
                token=secrets.token_urlsafe(30),
                expires=timezone.now() + timedelta(seconds=expires_seconds),
                scope='read write'
            )
            
            return Response({
                'access_token': access_token_obj.token,
                'token_type': 'Bearer',
                'expires_in': expires_seconds,
                'scope': 'read write',
                'user': UserSerializer(user).data
            })
            
        except Exception as e:
            print(f"Error en autenticación social: {str(e)}")
            return Response({
                'error': f'Error en autenticación con {provider}: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def get_user_info_from_provider(self, provider, access_token):
        """Obtener información del usuario desde el proveedor social"""
        import requests
        
        try:
            if provider == 'google':
                response = requests.get(
                    'https://www.googleapis.com/oauth2/v2/userinfo',
                    headers={'Authorization': f'Bearer {access_token}'}
                )
                if response.status_code == 200:
                    data = response.json()
                    return {
                        'email': data.get('email'),
                        'first_name': data.get('given_name', ''),
                        'last_name': data.get('family_name', ''),
                        'username': data.get('email', '').split('@')[0],
                        'avatar_url': data.get('picture'),
                        'provider_id': data.get('id'),
                    }
            
            elif provider == 'github':
                # Obtener información del usuario
                user_response = requests.get(
                    'https://api.github.com/user',
                    headers={'Authorization': f'token {access_token}'}
                )
                
                if user_response.status_code == 200:
                    user_data = user_response.json()
                    
                    # Obtener email (puede ser privado)
                    email_response = requests.get(
                        'https://api.github.com/user/emails',
                        headers={'Authorization': f'token {access_token}'}
                    )
                    
                    email = user_data.get('email')
                    if not email and email_response.status_code == 200:
                        emails = email_response.json()
                        primary_email = next((e for e in emails if e.get('primary')), None)
                        if primary_email:
                            email = primary_email.get('email')
                    
                    name_parts = (user_data.get('name') or '').split(' ', 1)
                    first_name = name_parts[0] if name_parts else ''
                    last_name = name_parts[1] if len(name_parts) > 1 else ''
                    
                    return {
                        'email': email,
                        'first_name': first_name,
                        'last_name': last_name,
                        'username': user_data.get('login'),
                        'avatar_url': user_data.get('avatar_url'),
                        'provider_id': str(user_data.get('id')),
                    }
            
            return None
            
        except Exception as e:
            print(f"Error obteniendo información de {provider}: {str(e)}")
            return None
    
    def get_or_create_user(self, user_info, provider):
        """Buscar o crear usuario basado en la información del proveedor"""
        email = user_info.get('email')
        username = user_info.get('username')
        
        if not email:
            raise ValueError('Email es requerido para la autenticación social')
        
        # Buscar usuario existente por email
        try:
            user = User.objects.get(email=email)
            # Actualizar información si es necesario
            if not user.first_name and user_info.get('first_name'):
                user.first_name = user_info.get('first_name')
            if not user.last_name and user_info.get('last_name'):
                user.last_name = user_info.get('last_name')
            user.save()
            return user
        except User.DoesNotExist:
            pass
        
        # Crear nuevo usuario
        # Asegurar que el username sea único
        base_username = username or email.split('@')[0]
        unique_username = base_username
        counter = 1
        while User.objects.filter(username=unique_username).exists():
            unique_username = f"{base_username}{counter}"
            counter += 1
        
        user = User.objects.create(
            email=email,
            username=unique_username,
            first_name=user_info.get('first_name', ''),
            last_name=user_info.get('last_name', ''),
            is_verified=True,  # Los usuarios sociales se consideran verificados
            email_verified=True,
        )
        
        return user


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def google_exchange_code(request):
    """
    Intercambiar código de Google por access_token
    """
    code = request.data.get('code')
    
    if not code:
        return Response({
            'error': 'Código es requerido'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Intercambiar código por token con Google
        token_response = requests.post('https://oauth2.googleapis.com/token', data={
            'client_id': settings.GOOGLE_CLIENT_ID,
            'client_secret': settings.GOOGLE_CLIENT_SECRET,
            'code': code,
            'grant_type': 'authorization_code',
            'redirect_uri': settings.GOOGLE_REDIRECT_URI,
        })
        
        if token_response.status_code != 200:
            return Response({
                'error': 'Error intercambiando código con Google',
                'details': token_response.json()
            }, status=status.HTTP_400_BAD_REQUEST)
        
        token_data = token_response.json()
        access_token = token_data.get('access_token')
        
        if not access_token:
            return Response({
                'error': 'No se recibió access_token de Google'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Obtener información del usuario de Google
        user_info_response = requests.get(
            'https://www.googleapis.com/oauth2/v2/userinfo',
            headers={'Authorization': f'Bearer {access_token}'}
        )
        
        if user_info_response.status_code != 200:
            return Response({
                'error': 'Error obteniendo información del usuario de Google'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        user_info = user_info_response.json()
        
        # Validar usuario
        email = user_info.get('email')
        if not email:
            return Response({
                'error': 'No se pudo obtener el email del usuario'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Buscar usuario existente - NO crear automáticamente
        try:
            user = User.objects.get(email=email)
            
            # Actualizar información del usuario si es necesario
            updated = False
            if not user.first_name and user_info.get('given_name'):
                user.first_name = user_info.get('given_name')
                updated = True
            if not user.last_name and user_info.get('family_name'):
                user.last_name = user_info.get('family_name')
                updated = True
            
            # Marcar como verificado si se autentica con Google
            if not user.is_verified or not user.email_verified:
                user.is_verified = True
                user.email_verified = True
                updated = True
            
            if updated:
                user.save()
                
        except User.DoesNotExist:
            return Response({
                'error': 'Usuario no registrado',
                'message': 'Este correo no está registrado en el sistema. Por favor, regístrate primero.',
                'email': email
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Crear token OAuth2 de nuestra aplicación
        from oauth2_provider.models import Application, AccessToken
        from datetime import datetime, timedelta
        import secrets
        
        # Obtener la aplicación OAuth2
        try:
            application = Application.objects.first()
            if not application:
                return Response({
                    'error': 'No hay aplicaciones OAuth2 configuradas. Ejecuta: python manage.py create_oauth_app'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception as e:
            return Response({
                'error': f'Error obteniendo aplicación OAuth2: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Crear token
        oauth2_config = getattr(settings, 'OAUTH2_PROVIDER', {})
        expires_seconds = oauth2_config.get('ACCESS_TOKEN_EXPIRE_SECONDS', 36000)
        
        from django.utils import timezone

        access_token_obj = AccessToken.objects.create(
            user=user,
            application=application,
            token=secrets.token_urlsafe(30),
            expires=timezone.now() + timedelta(seconds=expires_seconds),
            scope='read write'
        )
        
        return Response({
            'access_token': access_token_obj.token,
            'token_type': 'Bearer',
            'expires_in': expires_seconds,
            'scope': 'read write',
            'user': UserSerializer(user).data
        })
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response({
            'error': f'Error en autenticación con Google: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def google_register(request):
    """
    Registrar nuevo usuario con Google OAuth
    """
    code = request.data.get('code')
    
    if not code:
        return Response({
            'error': 'Código es requerido'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Intercambiar código por token con Google
        token_response = requests.post('https://oauth2.googleapis.com/token', data={
            'client_id': settings.GOOGLE_CLIENT_ID,
            'client_secret': settings.GOOGLE_CLIENT_SECRET,
            'code': code,
            'grant_type': 'authorization_code',
            'redirect_uri': settings.GOOGLE_REDIRECT_URI,
        })
        
        if token_response.status_code != 200:
            return Response({
                'error': 'Error intercambiando código con Google',
                'details': token_response.json()
            }, status=status.HTTP_400_BAD_REQUEST)
        
        token_data = token_response.json()
        access_token = token_data.get('access_token')
        
        if not access_token:
            return Response({
                'error': 'No se recibió access_token de Google'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Obtener información del usuario de Google
        user_info_response = requests.get(
            'https://www.googleapis.com/oauth2/v2/userinfo',
            headers={'Authorization': f'Bearer {access_token}'}
        )
        
        if user_info_response.status_code != 200:
            return Response({
                'error': 'Error obteniendo información del usuario de Google'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        user_info = user_info_response.json()
        email = user_info.get('email')
        
        if not email:
            return Response({
                'error': 'No se pudo obtener el email del usuario'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Verificar que el usuario NO exista (es un registro)
        if User.objects.filter(email=email).exists():
            return Response({
                'error': 'Usuario ya registrado',
                'message': 'Este correo ya está registrado. Por favor, inicia sesión.',
                'email': email
            }, status=status.HTTP_409_CONFLICT)
        
        # Crear nuevo usuario
        username = email.split('@')[0]
        # Asegurar username único
        base_username = username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base_username}{counter}"
            counter += 1
        
        user = User.objects.create(
            email=email,
            username=username,
            first_name=user_info.get('given_name', ''),
            last_name=user_info.get('family_name', ''),
            is_verified=True,
            email_verified=True,
        )
        
        # Crear token OAuth2
        from oauth2_provider.models import Application, AccessToken
        from datetime import datetime, timedelta
        import secrets
        
        application = Application.objects.first()
        if not application:
            return Response({
                'error': 'No hay aplicaciones OAuth2 configuradas'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        oauth2_config = getattr(settings, 'OAUTH2_PROVIDER', {})
        expires_seconds = oauth2_config.get('ACCESS_TOKEN_EXPIRE_SECONDS', 36000)
        
        from django.utils import timezone
        
        access_token_obj = AccessToken.objects.create(
            user=user,
            application=application,
            token=secrets.token_urlsafe(30),
            expires=timezone.now() + timedelta(seconds=expires_seconds),
            scope='read write'
        )
        
        return Response({
            'access_token': access_token_obj.token,
            'token_type': 'Bearer',
            'expires_in': expires_seconds,
            'scope': 'read write',
            'user': UserSerializer(user).data,
            'message': 'Usuario registrado exitosamente'
        })
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response({
            'error': f'Error en registro con Google: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET', 'POST'])
@permission_classes([permissions.AllowAny])
def test_auth(request):
    """
    Endpoint de prueba para diagnosticar problemas de autenticación
    """
    if request.method == 'GET':
        return Response({
            'message': 'Endpoint de prueba funcionando',
            'method': 'GET'
        })
    
    # POST - probar autenticación
    data = request.data
    return Response({
        'message': 'Datos recibidos correctamente',
        'method': 'POST',
        'data': data,
        'content_type': request.content_type
    })