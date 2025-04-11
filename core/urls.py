from django.urls import path
from .views import WorkshopDetailView, WorkshopListCreateView, me

urlpatterns = [
    path('auth/me/', me),
    path('workshops/', WorkshopListCreateView.as_view()),
    path('workshops/<int:pk>/', WorkshopDetailView.as_view()),
]