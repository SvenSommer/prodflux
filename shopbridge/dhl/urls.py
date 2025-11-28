"""URL configuration for DHL API endpoints."""
from django.urls import path

from .views import (
    dhl_config_view,
    dhl_health_check_view,
    dhl_create_label_view,
    dhl_delete_shipment_view,
)

urlpatterns = [
    path(
        "config/",
        dhl_config_view,
        name="dhl-config"
    ),
    path(
        "health/",
        dhl_health_check_view,
        name="dhl-health"
    ),
    path(
        "labels/",
        dhl_create_label_view,
        name="dhl-create-label"
    ),
    path(
        "shipments/<str:shipment_number>/",
        dhl_delete_shipment_view,
        name="dhl-delete-shipment"
    ),
]
