#!/usr/bin/env python
"""
Script to update all email templates with {{signature}} placeholder.
Run with: python manage.py shell < scripts/update_email_templates.py
"""
import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'prodflux.settings')
django.setup()

from shopbridge.models import EmailTemplate

templates_to_update = {
    'de': """Hallo {{first_name}},

der Adapter ist auf dem Weg zu Dir.

Wenn du die Sendung verfolgen möchtest, benutze bitte diesen Link:
{{tracking_link}}

Falls irgendwelche Fragen, Probleme oder Hinweise sind, bitte nicht zögern und an mich wenden.

Fliegende Grüße

Wir würden uns sehr über ein Foto von der erfolgreichen Installation freuen.
Falls Du zustimmst würden wir das dann in der „Galerie der Installationen" veröffentlichen, natürlich ohne jeden Bezug auf Deine Person oder das Flugzeug.

{{signature}}""",

    'en': """Hello {{first_name}},

The adapter is on its way to you.

Please note that we have experienced delivery times to the UK of up to 14 days recently. Thank you for your patience.

If you have any questions, issues, or suggestions, please don't hesitate to contact me.

Best regards

We'd really appreciate a photo of the successful installation.
If you agree, we'd be happy to publish it in our "Installation Gallery" — of course without any reference to you or your aircraft.

By the way — how did you hear about us?
We're always curious to learn where our customers found us.

{{signature}}""",

    'fr': """Bonjour {{first_name}},

L'adaptateur est en route vers toi.

Veuillez noter que nous avons constaté que les livraisons vers la France peuvent malheureusement prendre jusqu'à 14 jours en ce moment. Merci pour ta patience.

Si tu as des questions, des problèmes ou des remarques, n'hésite pas à me contacter.

Cordialement

Nous serions ravis de recevoir une photo de l'installation réussie.
Avec ton accord, nous pourrions la publier dans notre « Galerie des installations », bien entendu sans aucune référence à ta personne ou à ton avion.

{{signature}}""",

    'pl': """Cześć {{first_name}},

Adapter jest w drodze do Ciebie.

Śledź przesyłkę tutaj:
{{tracking_link}}

Dostawa do Polski zwykle trwa 5-7 dni roboczych.

Mamy małą prośbę: Czy po zainstalowaniu mógłbyś/mogłabyś wysłać nam zdjęcie swojej instalacji? Bardzo cieszymy się ze zdjęć od naszych klientów - oczywiście za Twoją zgodą.

Interesuje nas też, jak do nas trafiłeś/trafiłaś? Polecenie od znajomych, Google, media społecznościowe...?

Serdeczne pozdrowienia

{{signature}}""",

    'nl': """Hallo {{first_name}},

De adapter is onderweg naar jou.

Volg je pakket hier:
{{tracking_link}}

Levering naar Nederland duurt meestal 3-5 werkdagen.

We hebben een klein verzoek: Zou je na de installatie een foto van je installatie naar ons kunnen sturen? We zijn altijd blij met fotos van onze klanten - uiteraard met jouw toestemming.

We zijn ook benieuwd hoe je ons gevonden hebt? Aanbeveling van vrienden, Google, social media...?

Hartelijke groeten

{{signature}}""",

    'it': """Ciao {{first_name}},

L'adattatore è in arrivo.

Traccia il tuo pacco qui:
{{tracking_link}}

La consegna in Italia richiede solitamente 5-7 giorni lavorativi.

Abbiamo una piccola richiesta: Potresti inviarci una foto della tua installazione dopo averla completata? Siamo sempre felici di ricevere foto dai nostri clienti - ovviamente con il tuo consenso.

Ci piacerebbe anche sapere come ci hai trovato? Raccomandazione di amici, Google, social media...?

Cordiali saluti

{{signature}}""",

    'es': """Hola {{first_name}},

El adaptador está en camino hacia ti.

Sigue tu envío aquí:
{{tracking_link}}

La entrega a España suele tardar 5-7 días laborables.

Tenemos una pequeña petición: ¿Podrías enviarnos una foto de tu instalación después de completarla? Siempre nos alegra recibir fotos de nuestros clientes - por supuesto, con tu consentimiento.

También nos gustaría saber cómo nos encontraste: ¿Recomendación de amigos, Google, redes sociales...?

Saludos cordiales

{{signature}}""",

    'cs': """Dobrý den {{first_name}},

Adaptér je na cestě k Vám.

Sledujte zásilku zde:
{{tracking_link}}

Doručení do České republiky obvykle trvá 5-7 pracovních dnů.

Máme malou prosbu: Mohli byste nám po instalaci poslat fotografii? Vždy nás těší fotografie od našich zákazníků - samozřejmě s Vaším souhlasem.

Také by nás zajímalo, jak jste nás našli? Doporučení od přátel, Google, sociální sítě...?

S přátelským pozdravem

{{signature}}""",
}

if __name__ == '__main__':
    print("Updating email templates with {{signature}} placeholder...")
    
    for lang, body in templates_to_update.items():
        try:
            template = EmailTemplate.objects.filter(language=lang, is_default=True).first()
            if template:
                template.body = body
                template.save()
                print(f"  ✓ {lang}: Updated")
            else:
                print(f"  - {lang}: Not found")
        except Exception as e:
            print(f"  ✗ {lang}: Error - {e}")
    
    print("\nDone! All templates now use {{signature}} placeholder.")
    print(f"Total templates: {EmailTemplate.objects.count()}")
