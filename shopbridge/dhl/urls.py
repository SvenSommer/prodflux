"""URL configuration for DHL API endpoints."""
from django.urls import path

from .views import (
    dhl_config_view,
    dhl_health_check_view,
    dhl_create_label_view,
    dhl_delete_shipment_view,
    dhl_labels_by_order_view,
    dhl_label_pdf_view,
    dhl_label_mark_printed_view,
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
        "labels/order/<int:order_id>/",
        dhl_labels_by_order_view,
        name="dhl-labels-by-order"
    ),
    path(
        "labels/<int:label_id>/pdf/",
        dhl_label_pdf_view,
        name="dhl-label-pdf"
    ),
    path(
        "labels/<int:label_id>/printed/",
        dhl_label_mark_printed_view,
        name="dhl-label-mark-printed"
    ),
    path(
        "shipments/<str:shipment_number>/",
        dhl_delete_shipment_view,
        name="dhl-delete-shipment"
    ),
]
