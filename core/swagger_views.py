from django.shortcuts import render
from drf_spectacular.views import SpectacularSwaggerView, SpectacularRedocView
from django.urls import reverse


class CustomSwaggerView(SpectacularSwaggerView):
    """
    Custom Swagger UI view with integrated login form.
    """
    template_name = 'swagger_ui.html'
    
    def get(self, request, *args, **kwargs):
        schema_url = request.build_absolute_uri(reverse('schema'))
        return render(request, self.template_name, {
            'title': 'Prodflux API - Interactive Documentation',
            'schema_url': schema_url,
        })


class CustomRedocView(SpectacularRedocView):
    """
    Custom ReDoc view with integrated login form.
    """
    template_name = 'redoc.html'
    
    def get(self, request, *args, **kwargs):
        schema_url = request.build_absolute_uri(reverse('schema'))
        return render(request, self.template_name, {
            'title': 'Prodflux API - Documentation',
            'schema_url': schema_url,
        })
