"""DHL Shipment Service for label creation."""
from typing import List
import os
import logging

from .config import DHLConfig
from .client import DHLClient, DHLClientError
from .models import Shipment, LabelResult, Address, ShipmentDetails

logger = logging.getLogger(__name__)


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
    
    def validate_address(
        self,
        shipment: Shipment,
    ) -> dict:
        """Validate a shipment address without creating a label.
        
        Uses DHL's validate=true parameter to check if the address
        is valid and can be shipped to.
        
        Returns:
            dict with 'valid' (bool), 'warnings' (list), 'errors' (list)
        """
        # Set billing number if not provided
        if not shipment.billing_number:
            shipment.billing_number = self._get_billing_number(shipment.product)
        
        # In production, use shipper profile if configured
        if not self.config.is_sandbox and self.shipper_profile:
            shipment.shipper_ref = self.shipper_profile
        
        request_data = {
            "profile": self.profile,
            "shipments": [shipment.to_dict()],
        }
        
        try:
            # Use validate=true to only validate, not create
            response = self.client.post(
                "/orders", 
                request_data, 
                params={"validate": "true"}
            )
            
            items = response.get("items", [])
            if not items:
                return {"valid": False, "errors": ["No response from DHL"]}
            
            item = items[0]
            status = item.get("sstatus", {})
            status_code = status.get("statusCode", 500)
            
            warnings = []
            errors = []
            
            for msg in item.get("validationMessages", []):
                if msg.get("validationState") == "Warning":
                    warnings.append(msg.get("validationMessage", ""))
                elif msg.get("validationState") == "Error":
                    errors.append(msg.get("validationMessage", ""))
            
            # Status 200 means valid
            is_valid = status_code == 200 and len(errors) == 0
            
            return {
                "valid": is_valid,
                "warnings": warnings,
                "errors": errors,
                "status_code": status_code,
                "status_detail": status.get("detail", "")
            }
            
        except DHLClientError as e:
            # Parse error response for validation messages
            if e.response:
                items = e.response.get("items", [])
                errors = []
                for item in items:
                    for msg in item.get("validationMessages", []):
                        if msg.get("validationState") == "Error":
                            errors.append(msg.get("validationMessage", ""))
                if errors:
                    return {"valid": False, "errors": errors, "warnings": []}
            return {"valid": False, "errors": [str(e)], "warnings": []}

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
        }
        
        # printFormat must be a query parameter, not in request body
        params = {
            "printFormat": print_format,
        }
        
        # Debug logging to see what's being sent to DHL
        logger.info(f"DHL Request: {request_data}")
        logger.info(f"DHL Params: {params}")
        
        try:
            response = self.client.post("/orders", request_data, params=params)
            return self._parse_response(response)
        except DHLClientError as e:
            logger.error(f"DHL API Error: {e}")
            logger.error(f"DHL Error Response: {e.response}")
            
            # Extract detailed error information
            error_details = e.response or {}
            validation_errors = []
            
            # Parse validation messages from error response
            for item in error_details.get("items", []):
                for msg in item.get("validationMessages", []):
                    if msg.get("validationState") == "Error":
                        prop = msg.get("property", "")
                        message = msg.get("validationMessage", "")
                        full_msg = f"{prop}: {message}" if prop else message
                        validation_errors.append(full_msg)
            
            error_msg = str(e)
            if validation_errors:
                error_msg = f"{error_msg} - {'; '.join(validation_errors)}"
            
            return [LabelResult(
                success=False,
                error=error_msg,
                error_details=error_details,
                validation_errors=validation_errors,
                reference=s.reference
            ) for s in shipments]
    
    def delete_shipment(self, shipment_number: str) -> dict:
        """Delete a shipment that has not been manifested yet.
        
        Args:
            shipment_number: The DHL shipment number to delete
            
        Returns:
            Dict with status information
        """
        params = {
            "profile": self.profile,
            "shipment": shipment_number
        }
        try:
            result = self.client.delete("/orders", params=params)
            # Check if deletion was successful
            status = result.get("status", {})
            if status.get("statusCode") == 200:
                return {"success": True, "result": result}
            # Also check items array for status
            items = result.get("items", [])
            if items:
                item_status = items[0].get("sstatus", {})
                status_code = item_status.get("statusCode")
                if status_code == 200:
                    return {"success": True, "result": result}
                # Already deleted or unknown - still count as success for our DB
                if status_code == 204:
                    return {
                        "success": True,
                        "already_deleted": True,
                        "result": result
                    }
                return {
                    "success": False,
                    "error": item_status.get("detail", "Unknown error"),
                    "result": result
                }
            return {
                "success": False,
                "error": "Unknown response format",
                "result": result
            }
        except DHLClientError as e:
            # Check if it's a "not found" type error
            if e.response and isinstance(e.response, dict):
                items = e.response.get("items", [])
                if items:
                    item_status = items[0].get("sstatus", {})
                    if item_status.get("statusCode") == 204:
                        return {
                            "success": True,
                            "already_deleted": True,
                            "result": e.response
                        }
            return {"success": False, "error": str(e)}
    
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
