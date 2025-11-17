from django.urls import path
from .views import ProductDetailView, ProductListCreateView, ProductMaterialCreateView, ProductMaterialDetailView, ProductMaterialListView, ProductMaterialGlobalListView, ProductVariantDetailView, ProductVariantListCreateView, ProductVersionDetailView, ProductVersionListCreateView, aggregated_material_requirements_view, manufacture_product, material_requirements_view, producible_overview_view, producible_units_view, product_lifecycle_overview, product_stock_view, workshop_products_overview, product_material_dependencies, deprecate_product_with_materials

urlpatterns = [
    path('product-versions/', ProductVersionListCreateView.as_view(), name='product-version-list'),
    path('product-versions/<int:pk>/', ProductVersionDetailView.as_view(), name='product-version-detail'),
    path('product-variants/', ProductVariantListCreateView.as_view(), name='product-variant-list'),
    path('product-variants/<int:pk>/', ProductVariantDetailView.as_view(), name='product-variant-detail'),
    path('products/', ProductListCreateView.as_view(), name='product-list'),
    path('products/<int:pk>/', ProductDetailView.as_view(), name='product-detail'),
    path('products/<int:product_id>/requirements/', material_requirements_view, name='product-material-requirements'),
    path('product-materials/', ProductMaterialGlobalListView.as_view(), name='product-material-list-all'),
    path('product-materials/create/', ProductMaterialCreateView.as_view(), name='product-material-create'),
    path('product-materials/<int:pk>/', ProductMaterialDetailView.as_view(), name='product-material-detail'),
    path('manufacture/', manufacture_product, name='manufacture-product'),
    path('products/<int:product_id>/stock', product_stock_view, name='product-stock'),
    path('products/<int:product_id>/materials/', ProductMaterialListView.as_view(), name='product-material-list'),
    path('material-requirements/', aggregated_material_requirements_view, name='aggregated-material-requirements'),
    path('products/<int:product_id>/producible', producible_units_view, name='product-producible'),
    path('products/producible', producible_overview_view, name='product-producible-overview'),
    path('workshops/<int:workshop_id>/products/overview/', workshop_products_overview, name='workshop-products-overview'),
    path('products/lifecycle-overview/', product_lifecycle_overview, name='product-lifecycle-overview'),
    path('products/<int:product_id>/material-dependencies/', product_material_dependencies, name='product-material-dependencies'),
    path('products/<int:product_id>/deprecate/', deprecate_product_with_materials, name='deprecate-product-with-materials'),
    ]