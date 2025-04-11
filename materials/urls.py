from django.urls import path
from .views import DeliveryDetailView, DeliveryListCreateView, MaterialDetailView, MaterialListCreateView, MaterialMovementListCreateView, material_stock_view

urlpatterns = [
    path('materials/', MaterialListCreateView.as_view()),
    path('materials/<int:pk>/', MaterialDetailView.as_view(), name='material-detail'),
    path('materials/<int:pk>/movements', MaterialMovementListCreateView.as_view()),
    
    path('deliveries/', DeliveryListCreateView.as_view(), name='delivery-list-create'),
    path('deliveries/<int:pk>/', DeliveryDetailView.as_view(), name='delivery-detail'),
    path('materials/<int:material_id>/stock', material_stock_view, name='material-stock')
]