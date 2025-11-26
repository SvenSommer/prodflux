"""
URL configuration for prodflux project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
import os
from django.contrib import admin
from django.urls import path, include, re_path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from django.conf import settings
from django.conf.urls.static import static
from core.views import serve_frontend
from core.swagger_views import CustomSwaggerView, CustomRedocView
from drf_spectacular.views import SpectacularAPIView


urlpatterns = [
    path('admin/', admin.site.urls),
    # OpenAPI Schema & Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', CustomSwaggerView.as_view(), name='swagger-ui'),
    path('api/redoc/', CustomRedocView.as_view(), name='redoc'),
    # Authentication
    path('api/auth/login/', TokenObtainPairView.as_view(), 
         name='token_obtain_pair'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), 
         name='token_refresh'),
    # API Routes
    path('api/', include('core.urls')),
    path('api/', include('materials.urls')),
    path('api/', include('products.urls')),
    path("api/shopbridge/", include("shopbridge.urls")),
]

# Serve frontend for SPA routing (production or when explicitly enabled)
# Always serve frontend in production (DEBUG=False) for deep URLs
if not settings.DEBUG or os.environ.get('SERVE_FRONTEND') == 'True':
    urlpatterns += [
        # Catch all non-API, non-admin, non-static routes for SPA
        re_path(r'^(?!api/|admin/|static/|media/).*$',
                serve_frontend, name='frontend'),
    ]

if settings.DEBUG:
    urlpatterns += static(
        settings.MEDIA_URL,
        document_root=settings.MEDIA_ROOT
    )
