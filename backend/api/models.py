import uuid

from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone


class User(AbstractUser):
    
    ROLE_CHOICES = [
        ('CITIZEN', 'Citizen'),
        ('INSPECTOR', 'Sanitary Inspector'),
        ('COLLECTOR', 'Garbage Collector'),
        ('OFFICER', 'Municipal Officer'),
    ]
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='CITIZEN')
    phone = models.CharField(max_length=15, blank=True, null=True)
    
    class Meta:
        db_table = 'users'
    
    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"


class Complaint(models.Model):
    
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('ASSIGNED', 'Assigned'),
        ('RESOLVED', 'Resolved'),
        ('REJECTED', 'Rejected'),
        ('ESCALATED', 'Escalated'),
    ]
    
    complaint_id = models.CharField(max_length=20, unique=True, blank=True)
    complainant = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='complaints')
    complainant_name = models.CharField(max_length=100, blank=True)
    
    image_before = models.ImageField(upload_to='complaints/before/', blank=True, null=True)
    image_after = models.ImageField(upload_to='complaints/after/', blank=True, null=True)
    
    location_coords = models.CharField(max_length=50) # "lat,lng"
    location_address = models.CharField(max_length=255)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    urgency_level = models.IntegerField(default=1)
    
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_complaints')
    assigned_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='dispatcher_complaints')
    
    rejected_reason = models.TextField(blank=True, null=True)
    force_escalate = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'complaints'
        ordering = ['-urgency_level', '-created_at']
        
    def __str__(self):
        return f"{self.complaint_id} - {self.status}"
        
    def save(self, *args, **kwargs):
        if not self.complaint_id:
            today = timezone.now().strftime('%Y%m%d')
            suffix = str(uuid.uuid4().int)[:4]
            self.complaint_id = f"CC-{today}-{suffix}"
        super().save(*args, **kwargs)

