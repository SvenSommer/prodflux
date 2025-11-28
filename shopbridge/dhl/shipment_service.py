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
        """Get request profile name.
        
        Always use STANDARD_GRUPPENPROFIL for the request-level profile.
        The shipper profile (shipperRef) is set on shipment level instead.
        """
        return self.DEFAULT_PROFILE
    
    def create_label(
        self,
        shipment: Shipment,
        print_format: str = "910-300-356"  # 100x150mm for thermal printers
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
        print_format: str = "910-300-356",  # 100x150mm for thermal printers
    ) -> List[LabelResult]:
        """Create multiple shipment labels in one request.
        
        Args:
            shipments: List of shipments to create labels for
            print_format: DHL label format code (default: 100x150mm thermal)
        
        In production, if DHL_SHIPPER_PROFILE is configured, it will be used
        instead of the shipper address. The profile must be set up in GKP.
        """
        # Set billing number and shipper reference if not provided
        for shipment in shipments:
            if not shipment.billing_number:
                shipment.billing_number = self._get_billing_number(
                    shipment.product
                )
            # In production, use shipper profile if configured
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
    
    def delete_shipment(self, shipment_number: str) -> dict:
        """Delete a shipment that has not been manifested yet.
        
        Args:
            shipment_number: The DHL shipment number to delete
            
        Returns:
            Dict with status information
            
        Raises:
            DHLClientError: If deletion fails
        """
        params = {
            "profile": self.profile,
            "shipment": shipment_number
        }
        return self.client.delete("/orders", params=params)
    
    def delete_shipments(self, shipment_numbers: List[str]) -> dict:
        """Delete multiple shipments that have not been manifested yet.
        
        Args:
            shipment_numbers: List of DHL shipment numbers to delete (max 30)
            
        Returns:
            Dict with status information for each shipment
        """
        import requests
        import base64
        
        # DHL API accepts multiple shipment params with same name
        param_list = [("profile", self.profile)]
        for num in shipment_numbers[:30]:  # Max 30
            param_list.append(("shipment", num))
        
        url = f"{self.client.config.base_url}/orders"
        auth_string = f"{self.config.user}:{self.config.password}"
        auth_bytes = base64.b64encode(auth_string.encode()).decode()
        
        headers = {
            "dhl-api-key": self.config.api_key,
            "Authorization": f"Basic {auth_bytes}",
            "Accept": "application/json",
        }
        
        response = requests.delete(url, params=param_list, headers=headers)
        return response.json()
    
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
            "V62KP": "62",    # DHL Kleinpaket
            "V62WP": "62",    # Warenpost National
            "V66WPI": "66",   # Warenpost International
        }
        
        product_code = product_codes.get(product, "62")  # Default: Kleinpaket
        participation = self._get_participation(product)
        
        return f"{ekp}{product_code}{participation}"
    
    def _get_participation(self, product: str) -> str:
        """Get participation number for product."""
        participation_map = {
            "V01PAK": os.getenv("DHL_PARTICIPATION_PAKET", "01"),
            "V62KP": os.getenv("DHL_PARTICIPATION_KLEINPAKET", "01"),
            "V62WP": os.getenv("DHL_PARTICIPATION_WARENPOST", "01"),
            "V66WPI": os.getenv("DHL_PARTICIPATION_WARENPOST_INT", "01"),
        }
        return participation_map.get(product, "01")
    
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
