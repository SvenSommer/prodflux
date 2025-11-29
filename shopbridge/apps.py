from django.apps import AppConfig


class ShopbridgeConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'shopbridge'

    def ready(self):
        """
        Called when the application is ready.
        Start the WooCommerce cache scheduler for automatic cache refresh.
        """
        from .cache_scheduler import start_cache_scheduler
        start_cache_scheduler()
