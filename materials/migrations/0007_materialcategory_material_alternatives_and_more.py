# Generated by Django 5.2 on 2025-04-26 12:05

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('materials', '0006_alter_materialmovement_change_type'),
    ]

    operations = [
        migrations.CreateModel(
            name='MaterialCategory',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255)),
                ('order', models.PositiveIntegerField(default=0)),
            ],
            options={
                'ordering': ['order'],
            },
        ),
        migrations.AddField(
            model_name='material',
            name='alternatives',
            field=models.ManyToManyField(blank=True, related_name='alternative_to', to='materials.material'),
        ),
        migrations.AddField(
            model_name='material',
            name='category',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='materials', to='materials.materialcategory'),
        ),
    ]
