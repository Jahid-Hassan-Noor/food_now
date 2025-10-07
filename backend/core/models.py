# backend/core/models.py

from django.db import models
import uuid


class core_model(models.Model):
    uid = models.UUIDField(primary_key=True, editable=False, default=uuid.uuid4)

    class Meta:
        abstract = True


# class site_settings():
#     domain = models.CharField( max_length=100 , null=True , blank=True )