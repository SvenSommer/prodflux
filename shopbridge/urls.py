from django.urls import path, include
from .views import (
    woocommerce_orders_view,
    woocommerce_order_detail_view,
    woocommerce_order_update_view,
    woocommerce_order_update_status_view,
    woocommerce_cache_invalidate_view,
    woocommerce_cache_status_view,
    woocommerce_orders_stats_view,
    EmailTemplateListCreateView,
    EmailTemplateDetailView,
    email_template_render_view,
    email_template_placeholders_view,
    email_template_languages_view,
    get_language_for_country_view,
    email_sender_config_view,
    sales_excel_config_view,
    order_serial_numbers_create_view,
    order_serial_numbers_list_view,
    ShippingCountryConfigListView,
    ShippingCountryConfigDetailView,
    shipping_config_for_country,
    shipping_config_defaults,
    ProductManualListCreateView,
    ProductManualDetailView,
    product_manuals_for_order,
    product_manual_defaults,
)

urlpatterns = [
    # WooCommerce Orders
    path(
        "orders/",
        woocommerce_orders_view,
        name="woocommerce-orders"
    ),
    path(
        "orders/stats/",
        woocommerce_orders_stats_view,
        name="woocommerce-orders-stats"
    ),
    path(
        "orders/<int:order_id>/",
        woocommerce_order_detail_view,
        name="woocommerce-order-detail"
    ),
    path(
        "orders/<int:order_id>/edit/",
        woocommerce_order_update_view,
        name="woocommerce-order-update"
    ),
    path(
        "orders/<int:order_id>/status/",
        woocommerce_order_update_status_view,
        name="woocommerce-order-update-status"
    ),
    path(
        "cache/invalidate/",
        woocommerce_cache_invalidate_view,
        name="woocommerce-cache-invalidate"
    ),
    path(
        "cache/status/",
        woocommerce_cache_status_view,
        name="woocommerce-cache-status"
    ),

    # Email Templates
    path(
        "email-templates/",
        EmailTemplateListCreateView.as_view(),
        name="email-template-list"
    ),
    path(
        "email-templates/<int:pk>/",
        EmailTemplateDetailView.as_view(),
        name="email-template-detail"
    ),
    path(
        "email-templates/render/",
        email_template_render_view,
        name="email-template-render"
    ),
    path(
        "email-templates/placeholders/",
        email_template_placeholders_view,
        name="email-template-placeholders"
    ),
    path(
        "email-templates/languages/",
        email_template_languages_view,
        name="email-template-languages"
    ),
    path(
        "email-templates/language-for-country/",
        get_language_for_country_view,
        name="email-template-language-for-country"
    ),
    path(
        "email-templates/sender-config/",
        email_sender_config_view,
        name="email-sender-config"
    ),

    # Sales Excel Configuration
    path(
        "config/sales-excel/",
        sales_excel_config_view,
        name="sales-excel-config"
    ),

    # Order Serial Numbers
    path(
        "orders/serial-numbers/",
        order_serial_numbers_create_view,
        name="order-serial-numbers-create"
    ),
    path(
        "orders/<int:order_id>/serial-numbers/",
        order_serial_numbers_list_view,
        name="order-serial-numbers-list"
    ),

    # DHL Shipping
    path("dhl/", include("shopbridge.dhl.urls")),

    # Shipping Country Configuration
    path(
        "shipping-config/",
        ShippingCountryConfigListView.as_view(),
        name="shipping-config-list"
    ),
    path(
        "shipping-config/<int:pk>/",
        ShippingCountryConfigDetailView.as_view(),
        name="shipping-config-detail"
    ),
    path(
        "shipping-config/country/<str:country_code>/",
        shipping_config_for_country,
        name="shipping-config-for-country"
    ),
    path(
        "shipping-config/defaults/",
        shipping_config_defaults,
        name="shipping-config-defaults"
    ),

    # Product Manuals
    path(
        "product-manuals/",
        ProductManualListCreateView.as_view(),
        name="product-manual-list"
    ),
    path(
        "product-manuals/<int:pk>/",
        ProductManualDetailView.as_view(),
        name="product-manual-detail"
    ),
    path(
        "product-manuals/for-order/<int:order_id>/",
        product_manuals_for_order,
        name="product-manuals-for-order"
    ),
    path(
        "product-manuals/defaults/",
        product_manual_defaults,
        name="product-manual-defaults"
    ),
]
