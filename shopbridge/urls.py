from django.urls import path
from .views import woocommerce_order_detail_view, woocommerce_orders_view

urlpatterns = [
    path("orders/", woocommerce_orders_view, name="woocommerce-orders"),
    path("orders/<int:order_id>/", woocommerce_order_detail_view, name="woocommerce-order-detail"),
]