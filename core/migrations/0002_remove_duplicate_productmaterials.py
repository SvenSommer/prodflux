from django.db import migrations

def remove_duplicate_productmaterials(apps, schema_editor):
    ProductMaterial = apps.get_model('yourapp', 'ProductMaterial')
    from django.db.models import Count, Min

    # Aggregiere doppelte Kombinationen
    duplicates = (
        ProductMaterial.objects
        .values('product_id', 'material_id')
        .annotate(min_id=Min('id'), count=Count('id'))
        .filter(count__gt=1)
    )

    for entry in duplicates:
        # Alle Einträge mit dieser Kombination, außer dem mit min(id), löschen
        ProductMaterial.objects.filter(
            product_id=entry['product_id'],
            material_id=entry['material_id']
        ).exclude(id=entry['min_id']).delete()

class Migration(migrations.Migration):

    dependencies = [

    ]

    operations = [
        migrations.RunPython(remove_duplicate_productmaterials),
    ]