from django.core.management.base import BaseCommand
from django.contrib.contenttypes.models import ContentType
from materials.models import Delivery, MaterialMovement, MaterialTransfer

class Command(BaseCommand):
    help = 'Repariert Materialbewegungen: setzt fehlende content_type und object_id für Lieferungen und Transfers'

    def handle(self, *args, **kwargs):
        self.repair_deliveries()
        self.repair_transfers()
        self.stdout.write(self.style.SUCCESS('Reparatur abgeschlossen.'))

    def repair_deliveries(self):
        delivery_type = ContentType.objects.get_for_model(Delivery)

        deliveries = Delivery.objects.all()
        for delivery in deliveries:
            movements = MaterialMovement.objects.filter(
                workshop=delivery.workshop,
                note__startswith=f"Lieferung #{delivery.id}",
                content_type__isnull=True,
                object_id__isnull=True
            )
            for movement in movements:
                movement.content_type = delivery_type
                movement.object_id = delivery.id
                movement.save()
                self.stdout.write(f"Movement {movement.id} verknüpft mit Lieferung {delivery.id}")

    def repair_transfers(self):
        transfer_type = ContentType.objects.get_for_model(MaterialTransfer)

        transfers = MaterialTransfer.objects.all()
        for transfer in transfers:
            movements = MaterialMovement.objects.filter(
                note__startswith=f"Transfer #{transfer.id}",
                content_type__isnull=True,
                object_id__isnull=True
            )
            for movement in movements:
                movement.content_type = transfer_type
                movement.object_id = transfer.id
                movement.save()
                self.stdout.write(f"Movement {movement.id} verknüpft mit Transfer {transfer.id}")