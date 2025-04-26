from materials.models import MaterialCategory

CATEGORIES = [
    {"name": "Gehäuse", "order": 1},
    {"name": "PCB", "order": 2},
    {"name": "SMD Bauteile", "order": 3},
    {"name": "D-Sub Steckverbinder & Zubehör", "order": 4},
    {"name": "Bluetooth-Module", "order": 5},
    {"name": "RS232 Konverter", "order": 6},
    {"name": "RS422 Konverter", "order": 7},
    {"name": "Schrauben & Befestigungen", "order": 8},
    {"name": "Spannungswandler & Stromversorgung", "order": 9},
    {"name": "Passivbauteile (Widerstände, Kondensatoren, Dioden)", "order": 10},
    {"name": "Etiketten & Aufkleber", "order": 11},
    {"name": "Lötzubehör & Kabelmaterial", "order": 12},
]

created, skipped = 0, 0

for data in CATEGORIES:
    obj, was_created = MaterialCategory.objects.get_or_create(
        name=data["name"],
        defaults={"order": data["order"]}
    )
    if was_created:
        created += 1
    else:
        skipped += 1

print(f"Fertig: {created} Kategorien erstellt, {skipped} Kategorien übersprungen (bereits vorhanden).")