import re
from django.db import models
from django.conf import settings


def normalize_sku(sku):
    """
    Normalize WooCommerce SKU to match Prodflux artikelnummer/product_identifier.
    Handles variants like -LEFT, -RIGHT, -1, -2, -3, -E, etc.
    
    This function is used for matching WooCommerce SKUs to both:
    - Prodflux products (artikelnummer)
    - Product manuals (product_identifier)
    """
    if not sku:
        return None

    # Remove variant suffixes: -LEFT, -RIGHT, -1, -2, -3, -SL, etc.
    normalized = re.sub(r'-(LEFT|RIGHT|[0-9]+|SL)$', '', sku.upper())

    # Fix underscore to hyphen
    normalized = normalized.replace('_', '-')

    # Handle special cases for adapter variants
    # SD-AR620X-E-NG -> SD-AR620X-NG
    normalized = normalized.replace('-E-NG', '-NG')
    # SD-GENERIC-E-DS -> SD-GENERIC-DS
    normalized = normalized.replace('-E-DS', '-DS')
    # SD-KRT2-E -> SD-KRT2, SD-ATR833-E -> SD-ATR833, etc.
    normalized = re.sub(r'-E$', '', normalized)
    # SD-ATR833-A (angled) stays as is - no change needed

    return normalized


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


class OrderSerialNumber(models.Model):
    """
    Speichert Seriennummern von versendeten Adaptern mit Zuordnung zur Bestellnummer.
    """
    woocommerce_order_id = models.IntegerField(
        verbose_name='WooCommerce Bestellungs-ID',
        db_index=True
    )
    woocommerce_order_number = models.CharField(
        max_length=50,
        verbose_name='WooCommerce Bestellnummer',
        help_text='Die Bestellnummer aus WooCommerce (z.B. #12345)'
    )
    serial_number = models.CharField(
        max_length=100,
        verbose_name='Seriennummer',
        help_text='Seriennummer des versendeten Adapters'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Seriennummer'
        verbose_name_plural = 'Seriennummern'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"#{self.woocommerce_order_number} - {self.serial_number}"


class DHLLabel(models.Model):
    """
    DHL Versandlabels für WooCommerce-Bestellungen.
    
    Speichert die Sendungsnummer, das Label-PDF und Metadaten.
    """
    
    PRODUCT_CHOICES = [
        ('V01PAK', 'DHL Paket'),
        ('V62KP', 'DHL Kleinpaket'),
        # V62WP (Warenpost) wurde zum 1.1.2025 durch V62KP ersetzt
        ('V66WPI', 'Warenpost International'),
        ('V53WPAK', 'DHL Paket International'),
    ]
    
    STATUS_CHOICES = [
        ('created', 'Erstellt'),
        ('printed', 'Gedruckt'),
        ('shipped', 'Versendet'),
        ('deleted', 'Gelöscht'),
    ]
    
    # Identifikation
    shipment_number = models.CharField(
        max_length=50,
        unique=True,
        verbose_name='Sendungsnummer',
        db_index=True
    )
    
    # WooCommerce Verknüpfung
    woocommerce_order_id = models.IntegerField(
        verbose_name='WooCommerce Bestellungs-ID',
        db_index=True
    )
    woocommerce_order_number = models.CharField(
        max_length=50,
        verbose_name='WooCommerce Bestellnummer',
        blank=True,
        null=True
    )
    
    # Produkt & Referenz
    product = models.CharField(
        max_length=20,
        choices=PRODUCT_CHOICES,
        default='V62KP',
        verbose_name='DHL Produkt'
    )
    reference = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name='Kundenreferenz'
    )
    
    # Label-Daten
    label_pdf_base64 = models.TextField(
        verbose_name='Label PDF (Base64)',
        help_text='Das PDF-Label in Base64-Kodierung'
    )
    label_format = models.CharField(
        max_length=20,
        default='PDF',
        verbose_name='Label Format'
    )
    print_format = models.CharField(
        max_length=20,
        default='910-300-356',
        verbose_name='Druckformat'
    )
    
    # DHL Routing
    routing_code = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name='Routing Code'
    )
    
    # Status & Zeitstempel
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='created',
        verbose_name='Status'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    printed_at = models.DateTimeField(blank=True, null=True)
    deleted_at = models.DateTimeField(blank=True, null=True)
    
    class Meta:
        verbose_name = 'DHL Label'
        verbose_name_plural = 'DHL Labels'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['woocommerce_order_id']),
            models.Index(fields=['status', 'created_at']),
        ]
    
    def __str__(self):
        return f"{self.shipment_number} - WC #{self.woocommerce_order_number}"
    
    @property
    def is_deletable(self) -> bool:
        """Label kann gelöscht werden wenn noch nicht versendet."""
        return self.status in ['created', 'printed']
    
    def mark_as_printed(self):
        """Markiert das Label als gedruckt."""
        from django.utils import timezone
        self.status = 'printed'
        self.printed_at = timezone.now()
        self.save(update_fields=['status', 'printed_at'])
    
    def mark_as_deleted(self):
        """Markiert das Label als gelöscht (ohne DB-Eintrag zu löschen)."""
        from django.utils import timezone
        self.status = 'deleted'
        self.deleted_at = timezone.now()
        self.label_pdf_base64 = ''  # PDF nicht mehr speichern
        self.save(update_fields=['status', 'deleted_at', 'label_pdf_base64'])


class ShippingCountryConfig(models.Model):
    """
    Konfiguration für Versandmethoden pro Land.
    
    Definiert, welches DHL-Produkt oder welcher externe Link
    für ein bestimmtes Land verwendet werden soll.
    """
    
    SHIPPING_TYPE_CHOICES = [
        ('dhl_product', 'DHL Produkt (Label erstellen)'),
        ('external_link', 'Externer Link (manuell)'),
    ]
    
    DHL_PRODUCT_CHOICES = [
        # V62WP (Warenpost National) wurde zum 1.1.2025 durch V62KP ersetzt
        ('V62KP', 'DHL Kleinpaket'),
        ('V01PAK', 'DHL Paket'),
        ('V66WPI', 'Warenpost International'),
        ('V53WPAK', 'DHL Paket International'),
    ]
    
    country_code = models.CharField(
        max_length=2,
        unique=True,
        verbose_name='Ländercode (ISO)',
        help_text='2-stelliger ISO-Ländercode (z.B. DE, AT, CH)'
    )
    
    country_name = models.CharField(
        max_length=100,
        verbose_name='Ländername',
        help_text='Anzeigename des Landes'
    )
    
    shipping_type = models.CharField(
        max_length=20,
        choices=SHIPPING_TYPE_CHOICES,
        default='dhl_product',
        verbose_name='Versandart'
    )
    
    dhl_product = models.CharField(
        max_length=20,
        choices=DHL_PRODUCT_CHOICES,
        blank=True,
        null=True,
        verbose_name='DHL Produkt',
        help_text='Nur relevant wenn Versandart = DHL Produkt'
    )
    
    external_link = models.URLField(
        max_length=500,
        blank=True,
        null=True,
        verbose_name='Externer Link',
        help_text='Link zur externen Versandseite (z.B. DHL Privatkunden)'
    )
    
    external_link_label = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        default='Manuell versenden',
        verbose_name='Link-Beschriftung',
        help_text='Text für den Button/Link'
    )
    
    is_active = models.BooleanField(
        default=True,
        verbose_name='Aktiv'
    )
    
    notes = models.TextField(
        blank=True,
        null=True,
        verbose_name='Notizen',
        help_text='Interne Notizen zur Konfiguration'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Versandkonfiguration'
        verbose_name_plural = 'Versandkonfigurationen'
        ordering = ['country_name']
    
    def __str__(self):
        return f"{self.country_name} ({self.country_code})"
    
    @classmethod
    def get_config_for_country(cls, country_code: str):
        """Holt die Konfiguration für ein Land oder None."""
        try:
            return cls.objects.get(country_code=country_code.upper(), is_active=True)
        except cls.DoesNotExist:
            return None
    
    @classmethod
    def get_default_dhl_product(cls, country_code: str) -> str:
        """Gibt das Standard-DHL-Produkt für ein Land zurück."""
        config = cls.get_config_for_country(country_code)
        if config and config.shipping_type == 'dhl_product' and config.dhl_product:
            return config.dhl_product
        # Fallback: Warenpost für DE, International für andere
        return 'V62KP' if country_code.upper() == 'DE' else 'V66WPI'


class ProductManual(models.Model):
    """
    Handbücher/Anleitungen für Produkte, organisiert nach Sprache.
    
    Ermöglicht das Zuordnen von PDF-Links zu bestimmten Produkten
    und Sprachen für die Anzeige auf der Bestellseite.
    """
    
    LANGUAGE_CHOICES = [
        ('de', 'Deutsch'),
        ('en', 'English'),
        ('fr', 'Français'),
        ('es', 'Español'),
    ]
    
    MANUAL_TYPE_CHOICES = [
        ('installation', 'Installationsanleitung'),
        ('configuration', 'Einrichtungsanleitung'),
        ('quickstart', 'Schnellstartanleitung'),
        ('other', 'Sonstiges'),
    ]
    
    # Produkt-Name (SKU oder WooCommerce-Produktname)
    # Flexibel gehalten, damit verschiedene Produktbezeichnungen unterstützt werden
    product_identifier = models.CharField(
        max_length=200,
        verbose_name='Produkt-Bezeichnung',
        help_text='SKU oder Produktname (z.B. SD-KRT2, SD-ATR833)'
    )
    
    language = models.CharField(
        max_length=5,
        choices=LANGUAGE_CHOICES,
        default='de',
        verbose_name='Sprache'
    )
    
    manual_type = models.CharField(
        max_length=50,
        choices=MANUAL_TYPE_CHOICES,
        default='installation',
        verbose_name='Anleitungstyp'
    )
    
    title = models.CharField(
        max_length=255,
        verbose_name='Titel',
        help_text='Angezeigter Titel der Anleitung'
    )
    
    pdf_url = models.URLField(
        max_length=500,
        verbose_name='PDF-URL',
        help_text='Link zur PDF-Datei'
    )
    
    is_active = models.BooleanField(
        default=True,
        verbose_name='Aktiv'
    )
    
    # Für alle Bestellungen anzeigen (z.B. Einrichtungsanleitungen)
    applies_to_all = models.BooleanField(
        default=False,
        verbose_name='Für alle Bestellungen',
        help_text='Wenn aktiviert, wird dieses Handbuch bei jeder Bestellung angezeigt'
    )
    
    # Optionale Sortierreihenfolge
    order = models.PositiveIntegerField(
        default=0,
        verbose_name='Reihenfolge',
        help_text='Kleinere Zahlen werden zuerst angezeigt'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Produkthandbuch'
        verbose_name_plural = 'Produkthandbücher'
        ordering = ['product_identifier', 'language', 'order', 'title']
    
    def __str__(self):
        return f"{self.product_identifier} - {self.get_language_display()} - {self.title}"
    
    @classmethod
    def get_manuals_for_product_and_language(cls, product_identifier: str, language: str):
        """
        Holt alle aktiven Handbücher für ein Produkt in einer bestimmten Sprache.
        Verwendet die gleiche SKU-Normalisierungslogik wie das WooCommerce-Produkt-Mapping.
        Fallback auf Englisch wenn keine Handbücher in der gewünschten Sprache vorhanden.
        """
        # Normalisiere die SKU für besseres Matching
        # z.B. SD-KRT2-E-1 -> SD-KRT2, SD-AR620X-E-NG-LEFT -> SD-AR620X-NG
        normalized = normalize_sku(product_identifier)
        
        # Versuche erst exaktes Match mit normalisierter SKU
        manuals = cls.objects.filter(
            product_identifier__iexact=normalized if normalized else product_identifier,
            language=language,
            is_active=True,
            applies_to_all=False
        )
        
        # Falls kein exaktes Match, versuche Teil-Match
        if not manuals.exists():
            # Suche nach Produkt (case-insensitive Teilmatch)
            manuals = cls.objects.filter(
                product_identifier__icontains=normalized if normalized else product_identifier,
                language=language,
                is_active=True,
                applies_to_all=False
            )
        
        # Fallback auf Englisch
        if not manuals.exists() and language != 'en':
            manuals = cls.objects.filter(
                product_identifier__iexact=normalized if normalized else product_identifier,
                language='en',
                is_active=True,
                applies_to_all=False
            )
            if not manuals.exists():
                manuals = cls.objects.filter(
                    product_identifier__icontains=normalized if normalized else product_identifier,
                    language='en',
                    is_active=True,
                    applies_to_all=False
                )
        
        return manuals
    
    @classmethod
    def get_manuals_for_order(cls, product_identifiers: list, country_code: str):
        """
        Holt alle relevanten Handbücher für eine Bestellung basierend auf
        den Produkten und dem Zielland.
        """
        # Sprache basierend auf Land ermitteln
        language = get_language_for_country(country_code)
        
        # Fallback-Mapping für Sprachen die wir für Handbücher unterstützen
        if language not in ['de', 'en', 'fr', 'es']:
            language = 'en'
        
        all_manuals = []
        
        # 1. Produkt-spezifische Handbücher
        for product_id in product_identifiers:
            manuals = cls.get_manuals_for_product_and_language(product_id, language)
            all_manuals.extend(list(manuals))
        
        # 2. Handbücher die für alle Bestellungen gelten (z.B. Einrichtungsanleitungen)
        universal_manuals = cls.objects.filter(
            applies_to_all=True,
            language=language,
            is_active=True
        )
        # Fallback auf Englisch für universelle Handbücher
        if not universal_manuals.exists() and language != 'en':
            universal_manuals = cls.objects.filter(
                applies_to_all=True,
                language='en',
                is_active=True
            )
        all_manuals.extend(list(universal_manuals))
        
        # Duplikate entfernen (basierend auf ID)
        seen_ids = set()
        unique_manuals = []
        for manual in all_manuals:
            if manual.id not in seen_ids:
                seen_ids.add(manual.id)
                unique_manuals.append(manual)
        
        # Sortieren: Installationsanleitungen zuerst, dann nach order
        unique_manuals.sort(key=lambda m: (m.order, m.title))
        
        return unique_manuals
