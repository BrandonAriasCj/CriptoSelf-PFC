import os
from django.conf import settings
from django.http import HttpResponse, Http404
from django.views.generic import View


class ReactAppView(View):
    """
    Sirve la aplicación React desde el build
    """
    def get(self, request):
        try:
            # Ruta al archivo index.html del build de React
            react_build_path = os.path.join(settings.BASE_DIR, 'frontend', 'build')
            index_path = os.path.join(react_build_path, 'index.html')
            
            if os.path.exists(index_path):
                with open(index_path, 'r', encoding='utf-8') as f:
                    return HttpResponse(f.read(), content_type='text/html')
            else:
                # Si no existe el build, mostrar mensaje de desarrollo
                return HttpResponse(
                    """
                    <html>
                        <head><title>React App - Desarrollo</title></head>
                        <body>
                            <h1>Aplicación React en Desarrollo</h1>
                            <p>Para usar la aplicación React:</p>
                            <ol>
                                <li>Ve al directorio frontend: <code>cd frontend</code></li>
                                <li>Instala dependencias: <code>npm install</code></li>
                                <li>Inicia el servidor de desarrollo: <code>npm start</code></li>
                                <li>O construye para producción: <code>npm run build</code></li>
                            </ol>
                            <p>La API está disponible en: <a href="/api/">/api/</a></p>
                            <p>Panel de admin: <a href="/admin/">/admin/</a></p>
                        </body>
                    </html>
                    """,
                    content_type='text/html'
                )
        except Exception as e:
            raise Http404(f"Error loading React app: {str(e)}")