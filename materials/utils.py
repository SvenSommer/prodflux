# materials/utils.py

from collections import defaultdict
from materials.models import MaterialCategory
from materials.serializers import MaterialSerializer

def group_materials_by_category(materials_queryset, request):
    materials_queryset = sorted(
        materials_queryset,
        key=lambda m: (m.category.order if m.category else 9999, m.bezeichnung.lower())
    )

    grouped_materials = defaultdict(list)
    for material in materials_queryset:
        category_name = material.category.name if material.category else "Ohne Kategorie"
        grouped_materials[category_name].append(MaterialSerializer(material, context={'request': request}).data)

    sorted_response = []
    categories = MaterialCategory.objects.all().order_by('order')

    for category in categories:
        materials_in_category = grouped_materials.get(category.name, [])
        sorted_response.append({
            "category_id": category.id,
            "category_name": category.name,
            "materials": materials_in_category
        })

    if "Ohne Kategorie" in grouped_materials:
        sorted_response.append({
            "category_id": None,
            "category_name": "Ohne Kategorie",
            "materials": grouped_materials["Ohne Kategorie"]
        })

    return sorted_response