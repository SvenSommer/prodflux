from django.core.management.base import BaseCommand
from materials.models import MaterialMovement
from django.db.models import Count

class Command(BaseCommand):
    help = 'Bereinigt doppelte MaterialMovements von Lieferungen: behält nur ein Movement je Lieferung/Material/Werkstatt'

    def handle(self, *args, **kwargs):
        self.cleanup_delivery_movements()

    def cleanup_delivery_movements(self):
        # Alle MaterialMovements der Art "Lieferung", die eine Note mit "Lieferung #" haben
        movements = MaterialMovement.objects.filter(
            change_type='lieferung',
            note__startswith='Lieferung #'
        )

        # Gruppieren nach workshop, material, note
        duplicates = (
            movements.values('workshop', 'material', 'note')
            .annotate(movement_count=Count('id'))
            .filter(movement_count__gt=1)
        )

        total_deleted = 0

        for duplicate in duplicates:
            # Alle Bewegungen mit derselben Kombi laden
            dups = MaterialMovement.objects.filter(
                workshop=duplicate['workshop'],
                material=duplicate['material'],
                note=duplicate['note']
            ).order_by('created_at')

            # Ersten behalten, Rest löschen
            keep = dups.first()
            to_delete = dups.exclude(id=keep.id)

            count = to_delete.count()
            total_deleted += count

            to_delete.delete()

            self.stdout.write(
                f"Bereinigt {count} Duplikate für Lieferung: {duplicate['note']}, Material {duplicate['material']} in Werkstatt {duplicate['workshop']}"
            )

        self.stdout.write(self.style.SUCCESS(f"Insgesamt {total_deleted} doppelte MaterialMovements gelöscht."))