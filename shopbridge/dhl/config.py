"""DHL API Configuration."""
from dataclasses import dataclass
from pathlib import Path
import os
from dotenv import load_dotenv


@dataclass
class DHLConfig:
    """Configuration for DHL Parcel DE Shipping API."""
    
    # API Endpoints
    SANDBOX_URL = "https://api-sandbox.dhl.com/parcel/de/shipping/v2"
    PRODUCTION_URL = "https://api-eu.dhl.com/parcel/de/shipping/v2"
    
    # Product Codes
    PRODUCT_PAKET = "V01PAK"        # DHL Paket
    PRODUCT_KLEINPAKET = "V62KP"    # DHL Kleinpaket (ersetzt V62WP seit 1.1.2025)
    PRODUCT_WARENPOST_INT = "V66WPI" # Warenpost International
    
    api_key: str
    api_secret: str
    user: str
    password: str
    customer_number: str
    environment: str = "sandbox"
    
    @property
    def base_url(self) -> str:
        """Get base URL based on environment."""
        return self.SANDBOX_URL if self.is_sandbox else self.PRODUCTION_URL
    
    @property
    def is_sandbox(self) -> bool:
        """Check if using sandbox environment."""
        return self.environment.lower() == "sandbox"
    
    @classmethod
    def from_env(cls, environment: str = None) -> "DHLConfig":
        """Load configuration from environment variables."""
        _load_env_files()
        
        # Use ENVIRONMENT from root .env (development/production)
        root_env = os.getenv("ENVIRONMENT", "development")
        is_sandbox = root_env.lower() != "production"
        env = "sandbox" if is_sandbox else "production"
        
        suffix = "_SANDBOX" if is_sandbox else "_PROD"
        
        return cls(
            api_key=os.getenv("DHL_API_KEY", ""),
            api_secret=os.getenv("DHL_API_SECRET", ""),
            user=os.getenv(f"DHL_API_USER{suffix}", ""),
            password=os.getenv(f"DHL_API_PASSWORD{suffix}", ""),
            customer_number=os.getenv(f"DHL_CUSTOMER_NUMBER{suffix}", ""),
            environment=env,
        )


def _load_env_files():
    """Load environment files in order of priority."""
    env_paths = [
        Path("/etc/secrets/woocommerce_secrets.env"),
        Path(__file__).parent.parent / ".env",
        Path(".env"),
    ]
    
    for path in env_paths:
        if path.exists():
            load_dotenv(dotenv_path=path)
