from django.urls import path
from .views import WorkshopListCreateView, me

urlpatterns = [
    path('auth/me/', me),
    path('workshops/', WorkshopListCreateView.as_view()),
]