from abc import ABC, abstractmethod
from typing import Dict, List, Any, Optional

class BrokerInterface(ABC):
    """
    Abstract interface for broker integrations.
    All broker implementations must inherit from this class.
    """
    
    @abstractmethod
    def connect(self, credentials: Dict[str, Any]) -> Dict[str, Any]:
        """
        Connect to the broker's API
        
        Args:
            credentials (dict): Authentication credentials
            
        Returns:
            dict: Connection status and details
        """
        pass
    
    @abstractmethod
    def disconnect(self) -> Dict[str, Any]:
        """
        Disconnect from the broker's API
        
        Returns:
            dict: Disconnection status
        """
        pass
    
    @abstractmethod
    def get_profile(self) -> Dict[str, Any]:
        """
        Get user profile information
        
        Returns:
            dict: User profile details
        """
        pass
    
    @abstractmethod
    def get_holdings(self) -> Dict[str, Any]:
        """
        Get user's holdings
        
        Returns:
            dict: Dictionary containing list of holdings
        """
        pass
    
    @abstractmethod
    def get_positions(self) -> Dict[str, Any]:
        """
        Get user's current positions
        
        Returns:
            dict: Dictionary containing list of open positions
        """
        pass
    
    @abstractmethod
    def get_margin(self) -> Dict[str, Any]:
        """
        Get user's margin details
        
        Returns:
            dict: Margin information
        """
        pass
    
    @abstractmethod
    def place_order(self, order_params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Place a new order
        
        Args:
            order_params (dict): Order parameters
            
        Returns:
            dict: Order status and details
        """
        pass
    
    @abstractmethod
    def get_order_status(self, order_id: str) -> Dict[str, Any]:
        """
        Get status of a specific order
        
        Args:
            order_id (str): Order identifier
            
        Returns:
            dict: Order status and details
        """
        pass
    
    @abstractmethod
    def get_order_history(self) -> Dict[str, Any]:
        """
        Get history of orders
        
        Returns:
            dict: Dictionary containing list of historical orders
        """
        pass
    
    @abstractmethod
    def modify_order(self, order_id: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Modify an existing order
        
        Args:
            order_id (str): Order identifier
            params (dict): Parameters to modify
            
        Returns:
            dict: Updated order status
        """
        pass
    
    @abstractmethod
    def cancel_order(self, order_id: str) -> Dict[str, Any]:
        """
        Cancel an existing order
        
        Args:
            order_id (str): Order identifier
            
        Returns:
            dict: Cancellation status
        """
        pass