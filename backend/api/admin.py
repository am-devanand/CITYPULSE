from django.contrib import admin
from django.utils.html import format_html
from .models import User, Complaint


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['username', 'role', 'email', 'date_joined']
    list_filter = ['role']
    search_fields = ['username', 'email']


@admin.register(Complaint)
class ComplaintAdmin(admin.ModelAdmin):
    list_display = [
        'complaint_id', 'status', 'urgency_level',
        'location_address', 'complainant_name',
        'assigned_to', 'created_at'
    ]
    list_filter = ['status', 'urgency_level', 'created_at']
    search_fields = ['complaint_id', 'location_address', 'complainant_name']
    readonly_fields = [
        'complaint_id', 'created_at', 'updated_at',
        'image_before_preview', 'image_after_preview',
    ]
    list_select_related = ['complainant', 'assigned_to', 'assigned_by']

    fieldsets = (
        (None, {
            'fields': ('complaint_id', 'status', 'urgency_level')
        }),
        ('Complainant', {
            'fields': ('complainant', 'complainant_name')
        }),
        ('Location', {
            'fields': ('location_coords', 'location_address')
        }),
        ('Assignment', {
            'fields': ('assigned_to', 'assigned_by')
        }),
        ('Photos', {
            'fields': ('image_before', 'image_before_preview', 'image_after', 'image_after_preview')
        }),
        ('Resolution', {
            'fields': ('rejected_reason', 'force_escalate')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )

    @admin.display(description='Image Before')
    def image_before_preview(self, obj):
        if obj.image_before:
            return format_html('<img src="{}" style="max-height:100px"/>', obj.image_before.url)
        return '-'

    @admin.display(description='Image After')
    def image_after_preview(self, obj):
        if obj.image_after:
            return format_html('<img src="{}" style="max-height:100px"/>', obj.image_after.url)
        return '-'
