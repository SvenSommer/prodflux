"""DHL Shipment Service for label creation."""
from typing import List
import os

from .config import DHLConfig
from .client import DHLClient, DHLClientError
from .models import Shipment, LabelResult, Address, ShipmentDetails


class ShipmentService:
    """Service for creating DHL shipments and labels."""
    
    DEFAULT_PROFILE = "STANDARD_GRUPPENPROFIL"
    
    def __init__(self, config: DHLConfig = None):
        self.config = config or DHLConfig.from_env()
        self.client = DHLClient(self.config)
        self.shipper_profile = os.getenv("DHL_SHIPPER_PROFILE")
    
    @property
    def profile(self) -> str:
        """Get shipper profile name.
        
        In sandbox mode, always use the default test profile.
        In production, use the configured shipper profile.
        """
        if self.config.is_sandbox:
            return self.DEFAULT_PROFILE
        return self.shipper_profile or self.DEFAULT_PROFILE
    
    def create_label(
        self,
        shipment: Shipment,
        print_format: str = "910-300-300"  # 100x200mm for thermal printers
    ) -> LabelResult:
        """Create a single shipment label."""
        results = self.create_labels([shipment], print_format)
        return results[0] if results else LabelResult(
            success=False,
            error="No result returned"
        )
    
    def create_labels(
        self,
        shipments: List[Shipment],
        print_format: str = "910-300-300"  # 100x200mm for thermal printers
    ) -> List[LabelResult]:
        """Create multiple shipment labels in one request."""
        # Set billing number and shipper reference if not provided
        for shipment in shipments:
            if not shipment.billing_number:
                shipment.billing_number = self._get_billing_number(
                    shipment.product
                )
            # In production, use shipper profile reference instead of address
            if not self.config.is_sandbox and self.shipper_profile:
                shipment.shipper_ref = self.shipper_profile
        
        request_data = {
            "profile": self.profile,
            "shipments": [s.to_dict() for s in shipments],
            "labelFormat": print_format,
        }
        
        try:
            response = self.client.post("/orders", request_data)
            return self._parse_response(response)
        except DHLClientError as e:
            return [LabelResult(
                success=False,
                error=str(e),
                reference=s.reference
            ) for s in shipments]
    
    def _parse_response(self, response: dict) -> List[LabelResult]:
        """Parse API response into LabelResult objects."""
        results = []
        for item in response.get("items", []):
            results.append(LabelResult.from_api_response(item))
        return results
    
    def _get_billing_number(self, product: str) -> str:
        """Build billing number from config and product code."""
        ekp = self.config.customer_number
        
        # Product code mapping
        product_codes = {
            "V01PAK": "01",   # DHL Paket
            "V62WP": "62",    # Warenpost National
            "V66WPI": "66",   # Warenpost International
        }
        
        product_code = product_codes.get(product, "01")
        participation = self._get_participation(product)
        
        return f"{ekp}{product_code}{participation}"
    
    def _get_participation(self, product: str) -> str:
        """Get participation number for product."""
        participation_map = {
            "V01PAK": os.getenv("DHL_PARTICIPATION_PAKET", "01"),
            "V62WP": os.getenv("DHL_PARTICIPATION_WARENPOST", "01"),
            "V66WPI": os.getenv("DHL_PARTICIPATION_WARENPOST_INT", "01"),
        }
        return participation_map.get(product, "01")
    
    def delete_shipment(self, shipment_number: str) -> bool:
        """Delete/cancel a shipment."""
        try:
            self.client.delete(f"/orders/{shipment_number}")
            return True
        except DHLClientError:
            return False
    
    def get_default_shipper(self) -> Address:
        """Get default shipper address from environment."""
        return Address(
            name1=os.getenv("DHL_SHIPPER_NAME", "SD-Link GmbH"),
            street=os.getenv("DHL_SHIPPER_STREET", ""),
            house_number=os.getenv("DHL_SHIPPER_HOUSE", ""),
            postal_code=os.getenv("DHL_SHIPPER_POSTAL", ""),
            city=os.getenv("DHL_SHIPPER_CITY", ""),
            country=os.getenv("DHL_SHIPPER_COUNTRY", "DEU"),
        )


def create_label_for_order(
    recipient_name: str,
    street: str,
    house_number: str,
    postal_code: str,
    city: str,
    country: str = "DEU",
    weight_kg: float = 0.5,
    order_reference: str = None,
    product: str = "V01PAK",
) -> LabelResult:
    """
    Convenience function to create a label for an order.
    
    Returns a LabelResult with the PDF label in base64 format.
    """
    service = ShipmentService()
    
    shipment = Shipment(
        shipper=service.get_default_shipper(),
        consignee=Address(
            name1=recipient_name,
            street=street,
            house_number=house_number,
            postal_code=postal_code,
            city=city,
            country=country,
        ),
        details=ShipmentDetails(weight_kg=weight_kg),
        product=product,
        reference=order_reference,
    )
    
    return service.create_label(shipment)
