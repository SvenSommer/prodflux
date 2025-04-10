from django.urls import path
from .views import DeliveryCreateView, MaterialListCreateView, MaterialMovementListCreateView, material_stock_view

urlpatterns = [
    path('materials/', MaterialListCreateView.as_view()),
    path('materials/<int:pk>/movements', MaterialMovementListCreateView.as_view()),
    path('deliveries/', DeliveryCreateView.as_view(), name='delivery-create'),
    path('materials/<int:material_id>/stock', material_stock_view, name='material-stock')
]