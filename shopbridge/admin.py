from django.contrib import admin
from .models import EmailTemplate


@admin.register(EmailTemplate)
class EmailTemplateAdmin(admin.ModelAdmin):
    list_display = [
        'name',
        'language',
        'template_type',
        'is_active',
        'is_default',
        'updated_at'
    ]
    list_filter = ['language', 'template_type', 'is_active', 'is_default']
    search_fields = ['name', 'subject', 'body']
    ordering = ['language', 'template_type', 'name']

    fieldsets = (
        (None, {
            'fields': ('name', 'language', 'template_type')
        }),
        ('E-Mail Inhalt', {
            'fields': ('subject', 'body'),
            'description': (
                'Verfügbare Platzhalter: '
                '{{first_name}}, {{last_name}}, {{order_number}}, '
                '{{tracking_link}}, {{company_name}}'
            )
        }),
        ('Einstellungen', {
            'fields': ('is_active', 'is_default')
        }),
    )
