from django.urls import path
from .views import ProductListCreateView, ProductMaterialCreateView, ProductMaterialListView, manufacture_product, producible_overview_view, producible_units_view, product_stock_view

urlpatterns = [
    path('products/', ProductListCreateView.as_view(), name='product-list'),
    path('products/<int:product_id>/stock', product_stock_view, name='product-stock'),
    path('manufacture/', manufacture_product, name='manufacture-product'),
    path('product-materials/', ProductMaterialCreateView.as_view(), name='product-material-create'),
    path('products/<int:product_id>/materials/', ProductMaterialListView.as_view(), name='product-material-list'),
    path('products/<int:product_id>/producible', producible_units_view, name='product-producible'),
    path('products/producible', producible_overview_view, name='product-producible-overview'),
    ]