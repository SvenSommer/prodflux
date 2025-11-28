"""Data models for DHL shipments."""
from dataclasses import dataclass, field
from typing import List, Optional


@dataclass
class Address:
    """Postal address for shipper or consignee."""
    
    name1: str
    street: str
    house_number: str
    postal_code: str
    city: str
    country: str = "DEU"
    name2: Optional[str] = None
    name3: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    
    def to_dict(self) -> dict:
        """Convert to DHL API format."""
        data = {
            "name1": self.name1,
            "addressStreet": self.street,
            "addressHouse": self.house_number,
            "postalCode": self.postal_code,
            "city": self.city,
            "country": self.country,
        }
        
        if self.name2:
            data["name2"] = self.name2
        if self.name3:
            data["name3"] = self.name3
        if self.email:
            data["email"] = self.email
        if self.phone:
            data["phone"] = self.phone
            
        return data


@dataclass
class ShipmentDetails:
    """Shipment weight and dimensions."""
    
    weight_kg: float
    length_cm: Optional[int] = None
    width_cm: Optional[int] = None
    height_cm: Optional[int] = None
    
    def to_dict(self) -> dict:
        """Convert to DHL API format."""
        data = {
            "weight": {
                "uom": "kg",
                "value": self.weight_kg
            }
        }
        
        if all([self.length_cm, self.width_cm, self.height_cm]):
            data["dim"] = {
                "uom": "cm",
                "length": self.length_cm,
                "width": self.width_cm,
                "height": self.height_cm,
            }
            
        return data


@dataclass
class Shipment:
    """A single shipment for label creation."""
    
    shipper: Address
    consignee: Address
    details: ShipmentDetails
    product: str = "V01PAK"
    billing_number: str = ""
    reference: Optional[str] = None
    shipper_ref: Optional[str] = None  # Profile reference for production
    
    def to_dict(self) -> dict:
        """Convert to DHL API format."""
        data = {
            "product": self.product,
            "billingNumber": self.billing_number,
            "consignee": self.consignee.to_dict(),
            "details": self.details.to_dict(),
        }
        
        # Use shipperRef (profile) in production, shipper address in sandbox
        if self.shipper_ref:
            data["shipperRef"] = self.shipper_ref
        else:
            data["shipper"] = self.shipper.to_dict()
        
        if self.reference:
            # DHL requires refNo to be 8-35 characters
            ref = self.reference
            if len(ref) < 8:
                ref = ref.ljust(8, '0')  # Pad with zeros
            elif len(ref) > 35:
                ref = ref[:35]  # Truncate
            data["refNo"] = ref
            
        return data


@dataclass
class LabelResult:
    """Result of a label creation request."""
    
    success: bool
    shipment_number: Optional[str] = None
    label_pdf_base64: Optional[str] = None
    label_format: str = "PDF"
    routing_code: Optional[str] = None
    reference: Optional[str] = None
    warnings: List[str] = field(default_factory=list)
    error: Optional[str] = None
    
    @classmethod
    def from_api_response(cls, item: dict) -> "LabelResult":
        """Create from DHL API response item."""
        status = item.get("sstatus", {})
        is_success = status.get("statusCode", 500) == 200
        
        warnings = []
        for msg in item.get("validationMessages", []):
            if msg.get("validationState") == "Warning":
                warnings.append(msg.get("validationMessage", ""))
        
        label_data = item.get("label", {})
        
        return cls(
            success=is_success,
            shipment_number=item.get("shipmentNo"),
            label_pdf_base64=label_data.get("b64"),
            label_format=label_data.get("fileFormat", "PDF"),
            routing_code=item.get("routingCode"),
            reference=item.get("shipmentRefNo"),
            warnings=warnings,
            error=status.get("detail") if not is_success else None,
        )
