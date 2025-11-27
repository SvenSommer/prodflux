from django.urls import path
from .views import (
    woocommerce_orders_view,
    woocommerce_order_detail_view,
    woocommerce_cache_invalidate_view
)

urlpatterns = [
    path("orders/", woocommerce_orders_view, name="woocommerce-orders"),
    path("orders/<int:order_id>/", woocommerce_order_detail_view, name="woocommerce-order-detail"),
    path("cache/invalidate/", woocommerce_cache_invalidate_view, name="woocommerce-cache-invalidate"),
]