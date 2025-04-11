from django.urls import path
from .views import ProductDetailView, ProductListCreateView, ProductMaterialCreateView, ProductMaterialDetailView, ProductMaterialListView, manufacture_product, producible_overview_view, producible_units_view, product_stock_view, workshop_products_overview

urlpatterns = [
    path('products/', ProductListCreateView.as_view(), name='product-list'),
    path('products/<int:pk>/', ProductDetailView.as_view(), name='product-detail'),
    path('product-materials/', ProductMaterialCreateView.as_view(), name='product-material-create'),
    path('product-materials/<int:pk>/', ProductMaterialDetailView.as_view(), name='product-material-detail'),
    path('manufacture/', manufacture_product, name='manufacture-product'),
    path('products/<int:product_id>/stock', product_stock_view, name='product-stock'),
    path('products/<int:product_id>/materials/', ProductMaterialListView.as_view(), name='product-material-list'),
    path('products/<int:product_id>/producible', producible_units_view, name='product-producible'),
    path('products/producible', producible_overview_view, name='product-producible-overview'),
    path('workshops/<int:workshop_id>/products/overview/', workshop_products_overview, name='workshop-products-overview'),
    ]