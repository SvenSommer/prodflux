from django.db import models
from django.contrib.auth.models import AbstractUser

class Workshop(models.Model):
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name

class User(AbstractUser):
    workshop = models.ForeignKey(Workshop, null=True, blank=True, on_delete=models.SET_NULL)