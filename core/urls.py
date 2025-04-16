from django.urls import path
from .views import WorkshopDetailView, WorkshopListCreateView, health_check, me

urlpatterns = [
    path('', health_check), 
    path('auth/me/', me),
    path('workshops/', WorkshopListCreateView.as_view()),
    path('workshops/<int:pk>/', WorkshopDetailView.as_view()),
]