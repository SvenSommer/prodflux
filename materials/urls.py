from django.urls import path
from .views import (
    DeliveryDetailView,
    DeliveryListCreateView,
    MaterialDetailView,
    MaterialListCreateView,
    MaterialMovementDetailView,
    MaterialMovementListCreateView,
    MaterialTransferDetailView,
    MaterialTransferListCreateView,
    OrderDetailView,
    OrderListCreateView,
    all_materials_stock_by_workshop,
    material_stock_view,
)

urlpatterns = [
    path("materials/", MaterialListCreateView.as_view()),
    path("materials/<int:pk>/", MaterialDetailView.as_view(), name="material-detail"),
    path("materials/<int:pk>/movements", MaterialMovementListCreateView.as_view()),
    path("materials/<int:material_id>/movements/<int:pk>/", MaterialMovementDetailView.as_view()),
    path("materials/movements/<int:pk>/", MaterialMovementDetailView.as_view()),
    path("transfers/", MaterialTransferListCreateView.as_view(), name="transfer-list-create"),
    path("transfers/<int:pk>/", MaterialTransferDetailView.as_view(), name="transfer-detail"),
    path("deliveries/", DeliveryListCreateView.as_view(), name="delivery-list-create"),
    path("deliveries/<int:pk>/", DeliveryDetailView.as_view(), name="delivery-detail"),
    path("orders/", OrderListCreateView.as_view(), name="order-list-create"),
    path("orders/<int:pk>/", OrderDetailView.as_view(), name="order-detail"),
    path("materials/<int:material_id>/stock", material_stock_view, name="material-stock"),
    path("workshops/<int:workshop_id>/material-stock/", all_materials_stock_by_workshop, name="workshop-material-stock",
    ),
]
