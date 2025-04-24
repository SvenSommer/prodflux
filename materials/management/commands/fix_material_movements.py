from django.core.management.base import BaseCommand
from materials.models import Delivery, MaterialMovement

class Command(BaseCommand):
    help = "Löscht doppelte Lieferbewegungen und erzeugt sie korrekt neu (nur bei einer Lieferung sicher!)"

    def handle(self, *args, **options):
        delivery = Delivery.objects.first()

        if not delivery:
            self.stdout.write(self.style.WARNING("❌ Keine Lieferung gefunden."))
            return

        self.stdout.write(f"🔍 Bearbeite Lieferung #{delivery.id} ...")

        deleted_count, _ = MaterialMovement.objects.filter(
            workshop=delivery.workshop,
            change_type='lieferung',
            note__startswith=f"Lieferung #{delivery.id}"
        ).delete()

        self.stdout.write(f"🗑️  {deleted_count} alte Bewegungen gelöscht.")

        for item in delivery.items.all():
            item.save()

        self.stdout.write(self.style.SUCCESS("✅ Bewegungen wurden neu erzeugt."))