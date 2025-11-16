from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .serializers import UserSerializer
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
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
        with open(index_path, 'r', encoding='utf-8') as file:
            content = file.read()
            response = HttpResponse(content, content_type='text/html')
            # Add cache headers for better performance
            response['Cache-Control'] = 'no-cache, no-store, must-revalidate'
            response['Pragma'] = 'no-cache'
            response['Expires'] = '0'
            return response
    else:
        # Fallback for development or if build doesn't exist
        return HttpResponse(
            '<h1>Frontend not found</h1>'
            '<p>Please build the Angular frontend first: '
            '<code>cd prodflux-frontend && ng build</code></p>',
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