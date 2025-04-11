import os
from services.broker_interface import BrokerInterface
from services.pledge_interface import PledgeInterface
from services.broker_factory import BrokerFactory
from services.zerodha_adapter import ZerodhaAdapter
from services.fyers_adapter import FYERSAdapter
from services.cdsl_pledge_service import CDSLPledgeService

# Register adapters with the factory
BrokerFactory.register_adapter('zerodha', ZerodhaAdapter)
BrokerFactory.register_adapter('fyers', FYERSAdapter)

class UnifiedBrokerService:
    """
    Unified service that provides access to broker and pledge functionalities
    through a consistent interface, regardless of the underlying broker.
    """
    
    def __init__(self):
        """Initialize the unified broker service"""
        self.broker_adapter = None
        self.pledge_service = None
        self.connected_broker = None
        
        # Initialize pledge service
        self.pledge_service = CDSLPledgeService()
    
    def get_supported_brokers(self):
        """
        Get list of supported brokers
        
        Returns:
            list: Names of supported brokers
        """
        return BrokerFactory.get_supported_brokers()
    
    def connect(self, broker, credentials):
        """
        Connect to specified broker API
        
        Args:
            broker (str): Broker name ('zerodha', 'fyers', etc.)
            credentials (dict): Authentication credentials
            
        Returns:
            dict: Connection result
        """
        try:
            # Create broker adapter instance
            if not BrokerFactory.is_supported(broker):
                return {
                    "success": False,
                    "error": f"Unsupported broker: {broker}. Supported brokers: {', '.join(self.get_supported_brokers())}"
                }
            
            # Create new adapter
            self.broker_adapter = BrokerFactory.create(broker)
            
            # Connect to broker
            result = self.broker_adapter.connect(credentials)
            
            if result.get('success'):
                self.connected_broker = broker
            
            return result
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def disconnect(self):
        """
        Disconnect from current broker
        
        Returns:
            dict: Disconnection status
        """
        if not self.broker_adapter:
            return {
                "success": True,
                "message": "No broker connected"
            }
        
        try:
            result = self.broker_adapter.disconnect()
            
            if result.get('success'):
                self.connected_broker = None
                self.broker_adapter = None
            
            return result
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def get_portfolio(self):
        """
        Get user's portfolio (holdings, positions, and margin)
        
        Returns:
            dict: Combined portfolio data
        """
        if not self.broker_adapter:
            return {
                "success": False,
                "error": "No broker connected"
            }
        
        try:
            # Get holdings
            holdings_result = self.broker_adapter.get_holdings()
            if not holdings_result.get('success'):
                return holdings_result
            
            # Get positions
            positions_result = self.broker_adapter.get_positions()
            if not positions_result.get('success'):
                return positions_result
            
            # Get margin details
            margin_result = self.broker_adapter.get_margin()
            if not margin_result.get('success'):
                return margin_result
            
            # Combine all results
            portfolio = {
                "success": True,
                "holdings": holdings_result.get('holdings', []),
                "positions": positions_result.get('positions', []),
                "margin": margin_result.get('margins', {})
            }
            
            # Get pledged holdings if needed
            if self.pledge_service:
                pledged_result = self.pledge_service.get_pledged_holdings()
                if pledged_result.get('success'):
                    portfolio["pledged_holdings"] = pledged_result.get('pledges', [])
            
            return portfolio
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def place_order(self, order_params):
        """
        Place a new order
        
        Args:
            order_params (dict): Order parameters
            
        Returns:
            dict: Order status and details
        """
        if not self.broker_adapter:
            return {
                "success": False,
                "error": "No broker connected"
            }
        
        try:
            return self.broker_adapter.place_order(order_params)
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def get_order_status(self, order_id):
        """
        Get status of a specific order
        
        Args:
            order_id (str): Order identifier
            
        Returns:
            dict: Order status and details
        """
        if not self.broker_adapter:
            return {
                "success": False,
                "error": "No broker connected"
            }
        
        try:
            return self.broker_adapter.get_order_status(order_id)
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def get_order_history(self):
        """
        Get history of orders
        
        Returns:
            dict: List of historical orders
        """
        if not self.broker_adapter:
            return {
                "success": False,
                "error": "No broker connected"
            }
        
        try:
            return self.broker_adapter.get_order_history()
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    # Pledge related operations
    
    def create_pledge_request(self, stock_id, quantity, reason=None):
        """
        Create a new pledge request
        
        Args:
            stock_id (str): Stock identifier
            quantity (int): Number of shares to pledge
            reason (str, optional): Reason for pledging
            
        Returns:
            dict: Pledge request status and details
        """
        if not self.pledge_service:
            return {
                "success": False,
                "error": "Pledge service not initialized"
            }
        
        try:
            return self.pledge_service.create_pledge_request(stock_id, quantity, reason)
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def unpledge_request(self, pledge_id, quantity, reason=None):
        """
        Create an unpledge request
        
        Args:
            pledge_id (str): Pledge identifier
            quantity (int): Number of shares to unpledge
            reason (str, optional): Reason for unpledging
            
        Returns:
            dict: Unpledge request status and details
        """
        if not self.pledge_service:
            return {
                "success": False,
                "error": "Pledge service not initialized"
            }
        
        try:
            return self.pledge_service.unpledge_request(pledge_id, quantity, reason)
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def get_pledge_status(self, pledge_id):
        """
        Get status of a specific pledge request
        
        Args:
            pledge_id (str): Pledge identifier
            
        Returns:
            dict: Pledge status and details
        """
        if not self.pledge_service:
            return {
                "success": False,
                "error": "Pledge service not initialized"
            }
        
        try:
            return self.pledge_service.get_pledge_status(pledge_id)
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def get_pledged_holdings(self):
        """
        Get all pledged holdings
        
        Returns:
            dict: List of pledged holdings
        """
        if not self.pledge_service:
            return {
                "success": False,
                "error": "Pledge service not initialized"
            }
        
        try:
            return self.pledge_service.get_pledged_holdings()
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def authorize_pledge(self, pledge_id, otp=None):
        """
        Authorize a pledge request, potentially using OTP
        
        Args:
            pledge_id (str): Pledge identifier
            otp (str, optional): OTP for authorization
            
        Returns:
            dict: Authorization status
        """
        if not self.pledge_service:
            return {
                "success": False,
                "error": "Pledge service not initialized"
            }
        
        try:
            return self.pledge_service.authorize_pledge(pledge_id, otp)
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def request_pledge_otp(self, pledge_id):
        """
        Request an OTP for pledge authorization
        
        Args:
            pledge_id (str): Pledge identifier
            
        Returns:
            dict: OTP request status
        """
        if not self.pledge_service:
            return {
                "success": False,
                "error": "Pledge service not initialized"
            }
        
        try:
            return self.pledge_service.request_pledge_otp(pledge_id)
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }