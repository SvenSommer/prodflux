from django.db import models
from django.conf import settings


def get_email_signature():
    """Erstellt die E-Mail-Signatur aus den Settings."""
    parts = []
    if settings.EMAIL_SENDER_NAME:
        parts.append(settings.EMAIL_SENDER_NAME)
    parts.append("")
    parts.append("---")
    if settings.EMAIL_COMPANY_NAME:
        parts.append(settings.EMAIL_COMPANY_NAME)
    if settings.EMAIL_SENDER_PHONE:
        parts.append(f"Tel: {settings.EMAIL_SENDER_PHONE}")
    if settings.EMAIL_SENDER_EMAIL:
        parts.append(f"Email: {settings.EMAIL_SENDER_EMAIL}")
    return "\n".join(parts)


class EmailTemplate(models.Model):
    """
    Email-Templates für verschiedene Sprachen mit Platzhalter-Unterstützung.
    
    Verfügbare Platzhalter:
    - {{first_name}} - Vorname des Kunden
    - {{last_name}} - Nachname des Kunden
    - {{order_number}} - Bestellnummer
    - {{tracking_link}} - Tracking-Link (optional)
    - {{company_name}} - Firmenname (falls vorhanden)
    - {{signature}} - E-Mail-Signatur (aus Settings)
    """
    
    LANGUAGE_CHOICES = [
        ('de', 'Deutsch'),
        ('en', 'English'),
        ('fr', 'Français'),
        ('es', 'Español'),
        ('it', 'Italiano'),
        ('nl', 'Nederlands'),
        ('pl', 'Polski'),
        ('cs', 'Čeština'),
    ]
    
    TEMPLATE_TYPE_CHOICES = [
        ('order_shipped', 'Bestellung versendet'),
        ('order_completed', 'Bestellung abgeschlossen'),
        ('order_reminder', 'Erinnerung'),
    ]
    
    language = models.CharField(
        max_length=5,
        choices=LANGUAGE_CHOICES,
        default='de',
        verbose_name='Sprache'
    )
    
    template_type = models.CharField(
        max_length=50,
        choices=TEMPLATE_TYPE_CHOICES,
        default='order_shipped',
        verbose_name='Template-Typ'
    )
    
    name = models.CharField(
        max_length=100,
        verbose_name='Template-Name',
        help_text='Interner Name zur Identifikation'
    )
    
    subject = models.CharField(
        max_length=255,
        verbose_name='Betreff',
        help_text='E-Mail Betreff mit Platzhaltern'
    )
    
    body = models.TextField(
        verbose_name='E-Mail Text',
        help_text='E-Mail Inhalt mit Platzhaltern'
    )
    
    is_active = models.BooleanField(
        default=True,
        verbose_name='Aktiv'
    )
    
    is_default = models.BooleanField(
        default=False,
        verbose_name='Standard-Template',
        help_text='Wird automatisch für diese Sprache verwendet'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'E-Mail Template'
        verbose_name_plural = 'E-Mail Templates'
        ordering = ['language', 'template_type', 'name']
        # Nur ein Default-Template pro Sprache und Typ
        constraints = [
            models.UniqueConstraint(
                fields=['language', 'template_type'],
                condition=models.Q(is_default=True),
                name='unique_default_template_per_language_type'
            )
        ]
    
    def __str__(self):
        return f"{self.get_language_display()} - {self.name}"
    
    def render_subject(self, context: dict) -> str:
        """Ersetzt Platzhalter im Betreff."""
        result = self.subject
        for key, value in context.items():
            result = result.replace(f'{{{{{key}}}}}', str(value or ''))
        return result
    
    def render_body(self, context: dict) -> str:
        """Ersetzt Platzhalter im Text, inkl. Signatur aus Settings."""
        # Signatur automatisch hinzufügen
        context_with_signature = context.copy()
        context_with_signature['signature'] = get_email_signature()
        
        result = self.body
        for key, value in context_with_signature.items():
            result = result.replace(f'{{{{{key}}}}}', str(value or ''))
        return result
    
    @classmethod
    def get_available_placeholders(cls) -> list:
        """Gibt Liste der verfügbaren Platzhalter zurück."""
        return [
            {'key': 'first_name', 'description': 'Vorname des Kunden'},
            {'key': 'last_name', 'description': 'Nachname des Kunden'},
            {'key': 'order_number', 'description': 'Bestellnummer'},
            {'key': 'tracking_link', 'description': 'Tracking-Link'},
            {'key': 'company_name', 'description': 'Firmenname'},
            {'key': 'signature', 'description': 'E-Mail-Signatur (automatisch)'},
        ]


# Standard-Absender E-Mail aus Settings
def get_default_from_email():
    return settings.EMAIL_SENDER_EMAIL


# Mapping von Ländern zu Sprachen
COUNTRY_LANGUAGE_MAP = {
    # Deutsch
    'DE': 'de', 'AT': 'de', 'CH': 'de', 'LI': 'de', 'LU': 'de',
    # Englisch
    'GB': 'en', 'US': 'en', 'CA': 'en', 'AU': 'en', 'NZ': 'en',
    'IE': 'en', 'ZA': 'en', 'IN': 'en', 'SG': 'en', 'SE': 'en',
    'NO': 'en', 'DK': 'en', 'FI': 'en',
    # Französisch
    'FR': 'fr', 'BE': 'fr', 'MC': 'fr',
    # Spanisch
    'ES': 'es', 'MX': 'es', 'AR': 'es', 'CL': 'es', 'CO': 'es',
    # Italienisch
    'IT': 'it', 'SM': 'it', 'VA': 'it',
    # Niederländisch
    'NL': 'nl',
    # Polnisch
    'PL': 'pl',
    # Tschechisch
    'CZ': 'cs',
}


def get_language_for_country(country_code: str) -> str:
    """Ermittelt die Sprache basierend auf dem Ländercode."""
    return COUNTRY_LANGUAGE_MAP.get(country_code.upper(), 'en')
