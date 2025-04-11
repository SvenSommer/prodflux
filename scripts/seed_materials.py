# scripts/seed_materials.py (manuell ausführen mit `python manage.py shell < scripts/seed_materials.py`)
# python manage.py createsuperuser
from materials.models import Material

MATERIALS = [
    {'bezeichnung': 'PCB SD-KRT2-E', 'hersteller_bezeichnung': 'PCB SD-KRT2-E', 'preis_brutto': 10.0, 'quelle': 'Betalayout', 'bestell_nr': 'PCB SD-KRT2-E'},
    {'bezeichnung': 'PCB SD-KRT2-A', 'hersteller_bezeichnung': 'PCB SD-KRT2-A', 'preis_brutto': 10.0, 'quelle': 'Betalayout', 'bestell_nr': 'PCB SD-KRT2-A'},
    {'bezeichnung': 'PCB SD-GENERIC-E', 'hersteller_bezeichnung': 'PCB SD-GENERIC-E', 'preis_brutto': 10.0, 'quelle': 'Betalayout', 'bestell_nr': 'PCB SD-GENERIC-E'},
    {'bezeichnung': 'PCB SD-ATR833-E', 'hersteller_bezeichnung': 'PCB SD-ATR833-E', 'preis_brutto': 11.0, 'quelle': 'Betalayout', 'bestell_nr': 'PCB SD-ATR833-E'},
    {'bezeichnung': 'PCB SD-ATR833-A', 'hersteller_bezeichnung': 'PCB SD-ATR833-A', 'preis_brutto': 11.0, 'quelle': 'Betalayout', 'bestell_nr': 'PCB SD-ATR833-A'},
    {'bezeichnung': 'Gehäuse 3D PETG SD-AR620X-E', 'hersteller_bezeichnung': 'Gehäuse 3D PETG SD-AR620X-E', 'preis_brutto': 4.0, 'quelle': 'SD-Link', 'bestell_nr': 'Gehäuse 3D PETG SD-AR620X-E'},
    {'bezeichnung': 'Gehäuse 3D PETG SD-ATR833-E', 'hersteller_bezeichnung': 'Gehäuse 3D PETG SD-ATR833-E', 'preis_brutto': 4.0, 'quelle': 'SD-Link', 'bestell_nr': 'Gehäuse 3D PETG SD-ATR833-E'},
    {'bezeichnung': 'Gehäuse 3D PETG SD-ATR833-A-L', 'hersteller_bezeichnung': 'Gehäuse 3D PETG SD-ATR833-A-L', 'preis_brutto': 4.0, 'quelle': 'SD-Link', 'bestell_nr': 'Gehäuse 3D PETG SD-ATR833-A-L'},
    {'bezeichnung': 'Gehäuse 3D PETG SD-ATR833-A-R', 'hersteller_bezeichnung': 'Gehäuse 3D PETG SD-ATR833-A-R', 'preis_brutto': 4.0, 'quelle': 'SD-Link', 'bestell_nr': 'Gehäuse 3D PETG SD-ATR833-A-R'},
    {'bezeichnung': 'Gehäuse 3D PETG SD-KRT2-E', 'hersteller_bezeichnung': 'Gehäuse 3D PETG SD-KRT2-E', 'preis_brutto': 4.0, 'quelle': 'SD-Link', 'bestell_nr': 'Gehäuse 3D PETG SD-KRT2-E'},
    {'bezeichnung': 'Gehäuse 3D PETG SD-KRT2-A-L', 'hersteller_bezeichnung': 'Gehäuse 3D PETG SD-KRT2-A -L', 'preis_brutto': 4.0, 'quelle': 'SD-Link', 'bestell_nr': 'Gehäuse 3D PETG SD-KRT2-A-L'},
    {'bezeichnung': 'Gehäuse 3D PETG SD-KRT2-A-R', 'hersteller_bezeichnung': 'Gehäuse 3D PETG SD-KRT2-A -R', 'preis_brutto': 4.0, 'quelle': 'SD-Link', 'bestell_nr': 'Gehäuse 3D PETG SD-KRT2-A-R'},
    {'bezeichnung': 'Gehäuse 3D PETG SD-GENERIC-E', 'hersteller_bezeichnung': 'Gehäuse 3D PETG SD-GENERIC-E', 'preis_brutto': 4.0, 'quelle': 'SD-Link', 'bestell_nr': 'Gehäuse 3D PETG SD-GENERIC-E'},
    {'bezeichnung': 'Gehäuse Deckel 3D PETG SD-AR620X-E', 'hersteller_bezeichnung': 'Gehäuse Deckel 3D PETG SD-AR620X-E', 'preis_brutto': 1.0, 'quelle': 'SD-Link', 'bestell_nr': 'Gehäuse Deckel 3D PETG SD-AR620X-E'},
    {'bezeichnung': 'Gehäuse Deckel 3D PETG SD-ATR833-E', 'hersteller_bezeichnung': 'Gehäuse Deckel 3D PETG SD-ATR833-E', 'preis_brutto': 1.0, 'quelle': 'SD-Link', 'bestell_nr': 'Gehäuse Deckel 3D PETG SD-ATR833-E'},
    {'bezeichnung': 'Gehäuse Deckel 3D PETG SD-ATR833-A-L', 'hersteller_bezeichnung': 'Gehäuse Deckel 3D PETG SD-ATR833-A-L', 'preis_brutto': 1.0, 'quelle': 'SD-Link', 'bestell_nr': 'Gehäuse Deckel 3D PETG SD-ATR833-A-L'},
    {'bezeichnung': 'Gehäuse Deckel 3D PETG SD-ATR833-A-R', 'hersteller_bezeichnung': 'Gehäuse Deckel 3D PETG SD-ATR833-A-R', 'preis_brutto': 1.0, 'quelle': 'SD-Link', 'bestell_nr': 'Gehäuse Deckel 3D PETG SD-ATR833-A-R'},
    {'bezeichnung': 'Gehäuse Deckel 3D PETG SD-KRT2-E', 'hersteller_bezeichnung': 'Gehäuse Deckel 3D PETG SD-KRT2-E', 'preis_brutto': 1.0, 'quelle': 'SD-Link', 'bestell_nr': 'Gehäuse Deckel 3D PETG SD-KRT2-E'},
    {'bezeichnung': 'Gehäuse Deckel 3D PETG SD-KRT2-A-L', 'hersteller_bezeichnung': 'Gehäuse Deckel 3D PETG SD-KRT2-A -L', 'preis_brutto': 1.0, 'quelle': 'SD-Link', 'bestell_nr': 'Gehäuse Deckel 3D PETG SD-KRT2-A-L'},
    {'bezeichnung': 'Gehäuse Deckel 3D PETG SD-KRT2-A-R', 'hersteller_bezeichnung': 'Gehäuse Deckel 3D PETG SD-KRT2-A -R', 'preis_brutto': 1.0, 'quelle': 'SD-Link', 'bestell_nr': 'Gehäuse Deckel 3D PETG SD-KRT2-A-R'},
    {'bezeichnung': 'Gehäuse Deckel 3D PETG SD-GENERIC-E', 'hersteller_bezeichnung': 'Gehäuse Deckel 3D PETG SD-GENERIC-E', 'preis_brutto': 1.0, 'quelle': 'SD-Link', 'bestell_nr': 'Gehäuse Deckel 3D PETG SD-GENERIC-E'},
    {'bezeichnung': 'MH D-SUB Male 9pol. (Lötkelch) 5A Gold', 'hersteller_bezeichnung': 'MHDM9SP', 'preis_brutto': 0.95, 'quelle': 'reichelt.de', 'bestell_nr': 'MHDM9SP'},
    {'bezeichnung': 'MH D-SUB Female 15pol. (Lötkelch) 5A Gold', 'hersteller_bezeichnung': 'MHDB15SS', 'preis_brutto': 1.79, 'quelle': 'reichelt.de', 'bestell_nr': 'MHDB15SS'},
    {'bezeichnung': 'MH D-SUB Male 15pol. (Lötkelch) 5A Gold', 'hersteller_bezeichnung': 'MHDM15SP', 'preis_brutto': 1.25, 'quelle': 'reichelt.de', 'bestell_nr': 'MHDM15SP'},
    {'bezeichnung': 'MH D-SUB Female 15pol.  (Stifte) 5A Gold', 'hersteller_bezeichnung': 'D-SUB BU 15TL', 'preis_brutto': 4.0, 'quelle': 'reichelt.de', 'bestell_nr': 'D-SUB BU 15TL'},
    {'bezeichnung': 'MH D-SUB Male 25pol. (Lötkelch) 5A Gold', 'hersteller_bezeichnung': 'MHDM25SP', 'preis_brutto': 2.0, 'quelle': 'reichelt.de', 'bestell_nr': 'MHDM25SP'},
    {'bezeichnung': 'MH D-SUB Female 25pol. (Lötkelch) 5A Gold', 'hersteller_bezeichnung': 'MHSM25SS', 'preis_brutto': 2.0, 'quelle': 'reichelt.de', 'bestell_nr': 'MHDM25SS'},
    {'bezeichnung': 'MH D-SUB Female 25pol. (Stifte) 5A Gold (angled ATR833-A)', 'hersteller_bezeichnung': 'D-SUB BU 25TL', 'preis_brutto': 4.9, 'quelle': 'reichelt.de', 'bestell_nr': 'D-SUB BU 25TL'},
    {'bezeichnung': 'SUB-D Bu female 15 pol 2A (alternativ)', 'hersteller_bezeichnung': 'D-SUB BU 15', 'preis_brutto': 1.0, 'quelle': 'reichelt', 'bestell_nr': 'S-SUB BU15'},
    {'bezeichnung': 'SUB-D St male 15 pol 2A (alternativ)', 'hersteller_bezeichnung': 'D-SUB ST 15', 'preis_brutto': 1.0, 'quelle': 'reichelt', 'bestell_nr': 'D-SUB ST15'},
    {'bezeichnung': 'SUB-D St. 9 pol 2A (alternativ)', 'hersteller_bezeichnung': 'D-SUB ST 09', 'preis_brutto': 1.0, 'quelle': 'reichelt', 'bestell_nr': 'D-SUB ST 09'},
    {'bezeichnung': 'Conec D-SUB Female 15pol. (gerade Lötstifte) 5A Gold', 'hersteller_bezeichnung': '164B10079X', 'preis_brutto': 3.8, 'quelle': 'reichelt.de', 'bestell_nr': 'D-SUB BU 15TL'},
    {'bezeichnung': 'Conec D-SUB Female 25pol. (gerade Lötstifte) 5A Gold', 'hersteller_bezeichnung': '164B10089X', 'preis_brutto': 4.87, 'quelle': 'reichelt.de', 'bestell_nr': 'D-SUB BU 25TL'},
    {'bezeichnung': 'Conec Kit Amphenol Conec 165X11299XE (Becker)', 'hersteller_bezeichnung': '165X11299XE', 'preis_brutto': 5.0, 'quelle': 'Conrad', 'bestell_nr': 'DSUB CGKG25S'},
    {'bezeichnung': 'Conec Sicherungsbügel-Sortiment für D-Sub', 'hersteller_bezeichnung': '160X10239X', 'preis_brutto': 2.0, 'quelle': 'TME', 'bestell_nr': '160X10239X'},
    {'bezeichnung': 'Molex Spring Latch D-Sub accessory 173112-0367 male', 'hersteller_bezeichnung': '173112-0367', 'preis_brutto': 3.5, 'quelle': 'TME', 'bestell_nr': 'MX-173112-0367'},
    {'bezeichnung': 'Molex Spring Latch D-Sub accessory 173112-0307 female', 'hersteller_bezeichnung': '173112-0307', 'preis_brutto': 2.0, 'quelle': 'Farnell', 'bestell_nr': 'MX-173112-0307'},
    {'bezeichnung': 'D-Sub Schraubsverriegelungssatz M3', 'hersteller_bezeichnung': 'BKL 10120291', 'preis_brutto': 1.15, 'quelle': 'reichelt.de', 'bestell_nr': 'BKL 10120291'},
    {'bezeichnung': 'D-Sub Schraubsverriegelungssatz UNC 4/40', 'hersteller_bezeichnung': 'BKL 10120256', 'preis_brutto': 1.15, 'quelle': 'reichelt.de', 'bestell_nr': 'BKL 10120256'},
    {'bezeichnung': 'D-Sub Raststifte, Stahl, Sechskantbolzen Conec UNC 4/40', 'hersteller_bezeichnung': 'Conec 16-002190', 'preis_brutto': 2.0, 'quelle': 'reichelt.de', 'bestell_nr': 'RAST 2190'},
     {'bezeichnung': 'Schrauben 3 x 8 mm Flachkopf Kreuzschlitz', 'hersteller_bezeichnung': 'sourcing map 3x8mm', 'preis_brutto': 0.1, 'quelle': 'amazon', 'bestell_nr': 'sourcing map 3x8mm'},
    {'bezeichnung': 'Schrauben 2.5 x 8 Senkkopf Torx', 'hersteller_bezeichnung': 'B2.5X8/BN2043', 'preis_brutto': 0.1, 'quelle': 'TME', 'bestell_nr': 'B2.5X8/BN2043'},
    {'bezeichnung': 'HM-10 BLE Modul (BT05) nur für Radios (nicht im Generic!)', 'hersteller_bezeichnung': 'HM-10', 'preis_brutto': 5.0, 'quelle': 'ebay', 'bestell_nr': 'HM-10'},
    {'bezeichnung': 'HM-10 BLE Modul (MLT-BT05) auch für AP', 'hersteller_bezeichnung': 'HM-10', 'preis_brutto': 5.0, 'quelle': 'ebay', 'bestell_nr': 'HM-10'},
    {'bezeichnung': 'HM-18 BLE 5.0 Modul', 'hersteller_bezeichnung': 'HM-18', 'preis_brutto': 12.0, 'quelle': 'Amazone', 'bestell_nr': 'HM-18'},
    {'bezeichnung': 'RS422 MAX490 Mutual Transfer Full-duplex TTL Bi-directional Signal Module DC 5V (Becker)', 'hersteller_bezeichnung': 'RS422 MAX490', 'preis_brutto': 4.0, 'quelle': 'ebay', 'bestell_nr': 'RS422 MAX490'},
    {'bezeichnung': 'RS422 zu TTL 422 Modul Vollduplex 422 bicirctional Module DC 5 V (Becker)', 'hersteller_bezeichnung': 'RS422 Mini', 'preis_brutto': 4.0, 'quelle': 'aliexpress', 'bestell_nr': 'RS422 Mini'},
    {'bezeichnung': 'AMS1117 DC-DC Step Down Voltage Converter 6V - 12V to 5V (Becker)', 'hersteller_bezeichnung': 'AMS117', 'preis_brutto': 2.0, 'quelle': 'ebay', 'bestell_nr': 'AMS117'},
    {'bezeichnung': 'RS232 SP3232 TTL Konverter single channel', 'hersteller_bezeichnung': 'SP3232 S', 'preis_brutto': 4.0, 'quelle': 'ebay', 'bestell_nr': 'SP3232 S'},
    {'bezeichnung': 'RS232 SP3232 TTL Konverter dual channel', 'hersteller_bezeichnung': 'SP3232 D', 'preis_brutto': 4.0, 'quelle': 'ebay', 'bestell_nr': 'SP3232 D'},
    {'bezeichnung': 'Minifuse 125 mA', 'hersteller_bezeichnung': '0251.125MAT1L', 'preis_brutto': 1.0, 'quelle': 'reichelt.de', 'bestell_nr': 'LITT 0251.125MAT'},
    {'bezeichnung': 'MCP1804T5002IDB LDO 5 - 28 V', 'hersteller_bezeichnung': 'MCP1804T5002IDB', 'preis_brutto': 1.5, 'quelle': 'reichelt.de', 'bestell_nr': 'MCP1804T5002IDB'},
    {'bezeichnung': 'SMD 1206 2.0k 1/4 W', 'hersteller_bezeichnung': 'RC1206JR-072KL', 'preis_brutto': 0.1, 'quelle': 'reichelt.de', 'bestell_nr': 'SMD 1/4W 2,0K'},
    {'bezeichnung': 'SMD 1206 1.0k 1/4 W', 'hersteller_bezeichnung': 'CRCW12061K00FKEA', 'preis_brutto': 0.15, 'quelle': 'reichelt.de', 'bestell_nr': 'VIS CRCW12061K0'},
    {'bezeichnung': 'SMD 1206 1.0 uF', 'hersteller_bezeichnung': 'C1206C105K3RAC7800', 'preis_brutto': 0.1, 'quelle': 'reichelt.de', 'bestell_nr': 'KEM 1206 1,0U'},
    {'bezeichnung': 'SMD GS1A Diode 50 V, 1 A, DO-214AC/SMA', 'hersteller_bezeichnung': 'GS1A', 'preis_brutto': 0.05, 'quelle': 'reichelt.de', 'bestell_nr': 'GS1A'},
    {'bezeichnung': 'Diode 1N 4002 100 V, 1 A, DO-41 (Becker)', 'hersteller_bezeichnung': '1N 4002 DIO', 'preis_brutto': 0.03, 'quelle': 'reichelt.de', 'bestell_nr': '1N 4002 DIO'},
    {'bezeichnung': '50pol. Stiftleiste, gerade, RM 2,54', 'hersteller_bezeichnung': 'SL 1X50G 2,54', 'preis_brutto': 0.5, 'quelle': 'reichelt.de', 'bestell_nr': 'SL 1X50G 2,54'},
    {'bezeichnung': 'Etiketten / Typenschild SD-AR620X-E', 'hersteller_bezeichnung': 'TXT-SD-AR620X_E', 'preis_brutto': 0.1, 'quelle': 'SD-Link', 'bestell_nr': 'TXT-SD-AR620X_E'},
    {'bezeichnung': 'Etiketten / Typenschild SD-ATR833-E', 'hersteller_bezeichnung': 'TXT-SD-ATR833-E', 'preis_brutto': 0.1, 'quelle': 'SD-Link', 'bestell_nr': 'TXT-SD-ATR833-E'},
    {'bezeichnung': 'Etiketten / Typenschild SD-KRT2-E', 'hersteller_bezeichnung': 'TXT-SD-KRT2-E', 'preis_brutto': 0.1, 'quelle': 'SD-Link', 'bestell_nr': 'TXT-SD-KRT2-E'},
    {'bezeichnung': 'Etiketten / Typenschild SD-KRT2-A', 'hersteller_bezeichnung': 'TXT-SD-KRT2-A', 'preis_brutto': 0.1, 'quelle': 'SD-Link', 'bestell_nr': 'TXT-SD-KRT2-A'},
    {'bezeichnung': 'Etiketten / Typenschild SD-GENERIC-E', 'hersteller_bezeichnung': 'TXT-SD-GENERIC-E', 'preis_brutto': 0.1, 'quelle': 'SD-Link', 'bestell_nr': 'TXT-SD-GENERIC-E'},
    {'bezeichnung': 'Warranty-Label', 'hersteller_bezeichnung': 'Warranty-Label', 'preis_brutto': 0.2, 'quelle': 'ebay', 'bestell_nr': 'Warranty-Label'},
    {'bezeichnung': 'Lotpaste sn96,5 Ag3 Cu 0.5', 'hersteller_bezeichnung': 'Lotpaste sn96,5 Ag3 Cu 0.5', 'preis_brutto': 20.0, 'quelle': 'bottland', 'bestell_nr': 'Lotpaste sn96,5 Ag3 Cu 0.5'},
    {'bezeichnung': 'Kabel Tefzel [pro Meter]', 'hersteller_bezeichnung': 'Kabel Tefzel', 'preis_brutto': 20.0, 'quelle': '', 'bestell_nr': 'Kabel Tefzel'},
    {'bezeichnung': 'Schrumpfschlauch (Becker)', 'hersteller_bezeichnung': 'Schrumpfschlauch', 'preis_brutto': 5.0, 'quelle': 'ebay', 'bestell_nr': 'Schrumpfschlauch'},
    {'bezeichnung': 'Flussmittel', 'hersteller_bezeichnung': 'Flussmittel RF800 50 ml', 'preis_brutto': 2.0, 'quelle': 'bottland', 'bestell_nr': 'Flussmittel RF800 50 ml'},
    {'bezeichnung': 'Antistatic Bag', 'hersteller_bezeichnung': 'Zip-Abschirmbeutel 127 x 203 mm', 'preis_brutto': 0.26, 'quelle': 'Conrad', 'bestell_nr': '2245999-VQ'},
]

created, skipped = 0, 0

for data in MATERIALS:
    obj, was_created = Material.objects.get_or_create(
        bezeichnung=data["bezeichnung"],
        defaults={
            "hersteller_bezeichnung": data["hersteller_bezeichnung"],
            "preis_brutto": data["preis_brutto"],
            "quelle": data["quelle"],
            "bestell_nr": data["bestell_nr"]
        }
    )
    if was_created:
        created += 1
    else:
        skipped += 1

print(f"Fertig: {created} erstellt, {skipped} übersprungen (bereits vorhanden)")
