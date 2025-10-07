# notifications/models.py

from django.db import models
from core.models import core_model
from tinymce.models import HTMLField

# Create your models here.
class Notification(core_model):
    sender = models.CharField(max_length=100, default="")
    username = models.CharField(max_length=100, default="")
    title = models.CharField(max_length=300, default="Notification title")
    message = HTMLField( default="message")
    is_seen = models.BooleanField(default=False)
    time = models.DateTimeField(auto_now_add=True, null=True, blank=True )

    def __str__(self):
        return f"{self.uid}"


class Announcement(core_model):
    target = models.CharField(max_length=100, default="")
    title = models.CharField(max_length=300, default="Notification title")
    message = HTMLField( default="message")
    time = models.DateTimeField(auto_now_add=True, null=True, blank=True )

    def __str__(self):
        return f"{self.uid}"

class Error_log(core_model):
    occured = models.CharField(max_length=100, default="")
    title = models.CharField(max_length=300, default="Notification title")
    error = HTMLField( default="message")
    time = models.DateTimeField(auto_now_add=True, null=True, blank=True )

    def __str__(self):
        return f"{self.uid}"


