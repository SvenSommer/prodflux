"""DHL API HTTP Client."""
import base64
import requests
from typing import Optional
from .config import DHLConfig


class DHLClientError(Exception):
    """Custom exception for DHL API errors."""
    
    def __init__(self, message: str, status_code: int = None, response: dict = None):
        super().__init__(message)
        self.status_code = status_code
        self.response = response or {}


class DHLClient:
    """HTTP client for DHL Parcel DE Shipping API."""
    
    TIMEOUT = 30
    
    def __init__(self, config: DHLConfig):
        self.config = config
        self._session = requests.Session()
        self._setup_session()
    
    def _setup_session(self):
        """Setup session with authentication headers."""
        auth_string = f"{self.config.user}:{self.config.password}"
        auth_bytes = base64.b64encode(auth_string.encode()).decode()
        
        self._session.headers.update({
            "dhl-api-key": self.config.api_key,
            "Authorization": f"Basic {auth_bytes}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        })
    
    def post(self, endpoint: str, data: dict, params: dict = None) -> dict:
        """Make POST request to DHL API."""
        url = f"{self.config.base_url}{endpoint}"
        
        try:
            response = self._session.post(
                url, json=data, params=params, timeout=self.TIMEOUT
            )
            return self._handle_response(response)
        except requests.RequestException as e:
            raise DHLClientError(f"Request failed: {str(e)}")
    
    def get(self, endpoint: str, params: dict = None) -> dict:
        """Make GET request to DHL API."""
        url = f"{self.config.base_url}{endpoint}"
        
        try:
            response = self._session.get(url, params=params, timeout=self.TIMEOUT)
            return self._handle_response(response)
        except requests.RequestException as e:
            raise DHLClientError(f"Request failed: {str(e)}")
    
    def delete(self, endpoint: str, params: dict = None) -> dict:
        """Make DELETE request to DHL API."""
        url = f"{self.config.base_url}{endpoint}"
        
        try:
            response = self._session.delete(
                url, params=params, timeout=self.TIMEOUT
            )
            return self._handle_response(response)
        except requests.RequestException as e:
            raise DHLClientError(f"Request failed: {str(e)}")
    
    def _handle_response(self, response: requests.Response) -> dict:
        """Handle API response and raise errors if needed."""
        try:
            data = response.json()
        except ValueError:
            data = {"raw": response.text}
        
        # HTTP 400 with only warnings is acceptable (validation passes)
        if response.status_code == 400:
            items = data.get("items", [])
            # Check for warnings only
            has_only_warnings = all(
                all(
                    msg.get("validationState") == "Warning"
                    for msg in item.get("validationMessages", [])
                )
                for item in items
            )
            if has_only_warnings and items:
                # Return data - it's just warnings, not errors
                return data
            # For DELETE operations, return the data with error info
            # so the caller can handle specific status codes (like 204)
            if items:
                return data
        
        if response.status_code >= 400:
            # Log full error for debugging
            print(f"DHL API Error: {response.status_code}")
            print(f"Response: {data}")
            error_msg = data.get("detail", data.get("title", "Unknown error"))
            raise DHLClientError(
                message=error_msg,
                status_code=response.status_code,
                response=data
            )
        
        return data
    
    def health_check(self) -> bool:
        """Check if API connection is working."""
        try:
            # Try to get orders (will return 400 without params, but auth works)
            self.get("/orders")
            return True
        except DHLClientError as e:
            # 400 is expected (missing params), but means auth worked
            return e.status_code == 400
