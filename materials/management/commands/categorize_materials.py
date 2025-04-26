# materials/management/commands/categorize_materials.py

from django.core.management.base import BaseCommand
from materials.models import Material, MaterialCategory

class Command(BaseCommand):
    help = "Ordnet Materialien automatisch den richtigen Kategorien anhand der Bezeichnung zu."

    CATEGORY_MAPPING = {
        "Gehäuse": "Gehäuse",
        "Deckel": "Gehäuse",
        "PCB": "PCB",
        "SMD": "SMD Bauteile",
        "D-Sub": "D-Sub Steckverbinder & Zubehör",
        "SUB-D": "D-Sub Steckverbinder & Zubehör",
        "Molex": "D-Sub Steckverbinder & Zubehör",
        "Conec": "D-Sub Steckverbinder & Zubehör",
        "HM-10": "Bluetooth-Module",
        "HM-18": "Bluetooth-Module",
        "RS232": "RS232 Konverter",
        "RS422": "RS422 Konverter",
        "Schrauben": "Schrauben & Befestigungen",
        "Schrumpfschlauch": "Lötzubehör & Kabelmaterial",
        "Kabel Tefzel": "Lötzubehör & Kabelmaterial",
        "Lotpaste": "Lötzubehör & Kabelmaterial",
        "Flussmittel": "Lötzubehör & Kabelmaterial",
        "AMS1117": "Spannungswandler & Stromversorgung",
        "MCP1804": "Spannungswandler & Stromversorgung",
        "Minifuse": "Spannungswandler & Stromversorgung",
        "SMD 1206": "Passivbauteile (Widerstände, Kondensatoren, Dioden)",
        "GS1A": "Passivbauteile (Widerstände, Kondensatoren, Dioden)",
        "Diode 1N": "Passivbauteile (Widerstände, Kondensatoren, Dioden)",
        "Etiketten": "Etiketten & Aufkleber",
        "Warranty-Label": "Etiketten & Aufkleber",
        "50pol. Stiftleiste": "Lötzubehör & Kabelmaterial",
        "Antistatic Bag": "Versandmaterial",
        "Verpackungskarton": "Versandmaterial"  
    }

    def handle(self, *args, **options):
        updated, not_found = 0, 0

        for material in Material.objects.all():
            matched_category = None
            for keyword, category_name in self.CATEGORY_MAPPING.items():
                if keyword.lower() in material.bezeichnung.lower():
                    matched_category = category_name
                    break

            if matched_category:
                try:
                    category = MaterialCategory.objects.get(name=matched_category)
                    material.category = category
                    material.save()
                    updated += 1
                    self.stdout.write(self.style.SUCCESS(f"Kategorie '{category.name}' gesetzt für '{material.bezeichnung}'"))
                except MaterialCategory.DoesNotExist:
                    self.stdout.write(self.style.ERROR(f"Kategorie '{matched_category}' nicht gefunden für Material '{material.bezeichnung}'"))
            else:
                not_found += 1
                self.stdout.write(self.style.WARNING(f"Keine passende Kategorie für: {material.bezeichnung}"))

        self.stdout.write(self.style.SUCCESS(f"✅ Fertig: {updated} Materialien aktualisiert, {not_found} Materialien ohne Zuordnung."))