from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .serializers import UserSerializer
from rest_framework import generics
from .models import Workshop
from .serializers import WorkshopSerializer
from django.http import JsonResponse, HttpResponse
from django.conf import settings
import os


def health_check(request):
    return JsonResponse({"status": "ok"})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    serializer = UserSerializer(request.user)
    return Response(serializer.data)


def serve_frontend(request):
    """
    Serve the Angular frontend index.html for any non-API routes.
    This enables client-side routing in the Angular SPA.
    """
    # Path to the built Angular app
    frontend_path = os.path.join(
        settings.BASE_DIR,
        'prodflux-frontend',
        'dist',
        'prodflux-frontend',
        'browser'
    )
    index_path = os.path.join(frontend_path, 'index.html')
    
    # Check if the index.html file exists
    if os.path.exists(index_path):
        try:
            with open(index_path, 'r', encoding='utf-8') as file:
                content = file.read()
                response = HttpResponse(content, content_type='text/html')
                # Add cache headers for better performance
                response['Cache-Control'] = ('no-cache, no-store, '
                                             'must-revalidate')
                response['Pragma'] = 'no-cache'
                response['Expires'] = '0'
                return response
        except Exception:
            # In production, return a simple error page
            return HttpResponse(
                '<h1>Application Error</h1>'
                '<p>The application is temporarily unavailable.</p>',
                content_type='text/html',
                status=500
            )
    else:
        # In production, always try to serve from static files
        # This handles the case where static files are served by WhiteNoise
        from django.contrib.staticfiles import finders
        
        # Try to find index.html in static files
        static_index = finders.find('index.html')
        if static_index:
            try:
                with open(static_index, 'r', encoding='utf-8') as file:
                    content = file.read()
                    response = HttpResponse(content, content_type='text/html')
                    response['Cache-Control'] = ('no-cache, no-store, '
                                                 'must-revalidate')
                    response['Pragma'] = 'no-cache'
                    response['Expires'] = '0'
                    return response
            except Exception:
                pass
        
        # Fallback
        return HttpResponse(
            '<h1>Application Loading</h1>'
            '<p>Please wait while the application loads...</p>'
            '<script>window.location.href = "/";</script>',
            content_type='text/html',
            status=404
        )


class WorkshopListCreateView(generics.ListCreateAPIView):
    queryset = Workshop.objects.all()
    serializer_class = WorkshopSerializer
    permission_classes = [IsAuthenticated]


class WorkshopDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Workshop.objects.all()
    serializer_class = WorkshopSerializer
    permission_classes = [IsAuthenticated]
