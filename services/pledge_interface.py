from abc import ABC, abstractmethod
from typing import Dict, List, Any, Optional, Union

class PledgeInterface(ABC):
    """
    Abstract interface for pledge operations.
    All pledge implementations must inherit from this class.
    """
    
    @abstractmethod
    def create_pledge_request(self, stock_id: str, quantity: int, reason: Optional[str] = None) -> Dict[str, Any]:
        """
        Create a new pledge request
        
        Args:
            stock_id (str): Stock identifier
            quantity (int): Number of shares to pledge
            reason (str, optional): Reason for pledging
            
        Returns:
            dict: Pledge request status and details
        """
        pass
    
    @abstractmethod
    def unpledge_request(self, pledge_id: str, quantity: int, reason: Optional[str] = None) -> Dict[str, Any]:
        """
        Create an unpledge request
        
        Args:
            pledge_id (str): Pledge identifier
            quantity (int): Number of shares to unpledge
            reason (str, optional): Reason for unpledging
            
        Returns:
            dict: Unpledge request status and details
        """
        pass
    
    @abstractmethod
    def get_pledge_status(self, pledge_id: str) -> Dict[str, Any]:
        """
        Get status of a specific pledge request
        
        Args:
            pledge_id (str): Pledge identifier
            
        Returns:
            dict: Pledge status and details
        """
        pass
    
    @abstractmethod
    def get_pledged_holdings(self) -> Dict[str, Any]:
        """
        Get all pledged holdings
        
        Returns:
            dict: Dictionary containing list of pledged holdings
        """
        pass
    
    @abstractmethod
    def authorize_pledge(self, pledge_id: str, otp: Optional[str] = None) -> Dict[str, Any]:
        """
        Authorize a pledge request, potentially using OTP
        
        Args:
            pledge_id (str): Pledge identifier
            otp (str, optional): OTP for authorization
            
        Returns:
            dict: Authorization status
        """
        pass
    
    @abstractmethod
    def request_pledge_otp(self, pledge_id: str) -> Dict[str, Any]:
        """
        Request an OTP for pledge authorization
        
        Args:
            pledge_id (str): Pledge identifier
            
        Returns:
            dict: OTP request status
        """
        pass