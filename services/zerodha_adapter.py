import os
import requests
import json
import time
from services.broker_interface import BrokerInterface

class ZerodhaAdapter(BrokerInterface):
    """
    Implementation of BrokerInterface for Zerodha Kite Connect API
    """
    
    def __init__(self, config=None):
        """
        Initialize Zerodha adapter
        
        Args:
            config (dict, optional): Configuration for the adapter
        """
        self.api_key = os.getenv('ZERODHA_API_KEY')
        self.api_secret = os.getenv('ZERODHA_API_SECRET')
        
        if config is None:
            config = {}
            
        self.base_url = config.get('base_url', 'https://api.kite.trade')
        
        # Session handling
        self.access_token = None
        self.session_expiry = None
        self.user_id = None
        
        # Demo mode flag - for testing without actual Zerodha connections
        self.demo_mode = True if not self.api_key else False
        
        # Demo portfolio data
        self.demo_portfolio = {
            'holdings': [
                {
                    'symbol': 'RELIANCE',
                    'exchange': 'NSE',
                    'isin': 'INE002A01018',
                    'quantity': 10,
                    'avg_price': 2500.50,
                    'current_price': 2650.75,
                    'pnl': 1502.50,
                    'pnl_percent': 6.01
                },
                {
                    'symbol': 'HDFCBANK',
                    'exchange': 'NSE',
                    'isin': 'INE040A01034',
                    'quantity': 15,
                    'avg_price': 1600.25,
                    'current_price': 1550.50,
                    'pnl': -744.75,
                    'pnl_percent': -3.11
                },
                {
                    'symbol': 'TCS',
                    'exchange': 'NSE',
                    'isin': 'INE467B01029',
                    'quantity': 5,
                    'avg_price': 3400.00,
                    'current_price': 3600.25,
                    'pnl': 1001.25,
                    'pnl_percent': 5.89
                }
            ],
            'positions': [
                {
                    'symbol': 'NIFTY24APRFUT',
                    'exchange': 'NFO',
                    'quantity': 75,
                    'buy_price': 22450.00,
                    'current_price': 22500.00,
                    'pnl': 3750.00,
                    'product': 'NRML'
                },
                {
                    'symbol': 'BANKNIFTY24APRFUT',
                    'exchange': 'NFO',
                    'quantity': 25,
                    'buy_price': 47500.00,
                    'current_price': 47400.00,
                    'pnl': -2500.00,
                    'product': 'NRML'
                }
            ],
            'margins': {
                'total': 500000.00,
                'used': {
                    'equity': 100000.00,
                    'futures': 250000.00,
                    'options': 0.00,
                    'total': 350000.00
                },
                'available': {
                    'cash': 150000.00,
                    'collateral': 250000.00,
                    'total': 150000.00
                }
            }
        }
    
    def connect(self, credentials):
        """
        Connect to Zerodha API
        
        Args:
            credentials (dict): Authentication credentials
            
        Returns:
            dict: Connection status and details
        """
        if self.demo_mode:
            self.user_id = "ZD0000"
            self.access_token = "demo_zerodha_token"
            self.session_expiry = time.time() + 24*3600  # 24 hours from now
            
            return {
                'success': True,
                'message': "Connected to Zerodha in demo mode",
                'user_id': self.user_id
            }
        
        try:
            # Step 1: Get request token using login credentials
            request_token = credentials.get('request_token')
            
            if not request_token:
                # In production, direct the user to Kite login page to get request token
                return {
                    'success': False,
                    'error': "Request token required for authentication",
                    'auth_url': f"https://kite.zerodha.com/connect/login?api_key={self.api_key}"
                }
            
            # Step 2: Exchange request token for access token
            session_endpoint = f"{self.base_url}/session/token"
            session_params = {
                'api_key': self.api_key,
                'request_token': request_token,
                'checksum': credentials.get('checksum', '')
            }
            
            # In production, make actual API call
            # response = requests.post(session_endpoint, data=session_params)
            # if response.status_code == 200:
            #     data = response.json()
            #     self.access_token = data.get('access_token')
            #     self.user_id = data.get('user_id')
            #     self.session_expiry = time.time() + data.get('expires_in', 24*3600)
            #     return {
            #         'success': True,
            #         'message': "Connected to Zerodha",
            #         'user_id': self.user_id
            #     }
            # else:
            #     return {
            #         'success': False,
            #         'error': response.json().get('error', 'Authentication failed')
            #     }
            
            # For development without actual API
            self.access_token = "sample_zerodha_token"
            self.user_id = "ZD1234"
            self.session_expiry = time.time() + 24*3600  # 24 hours from now
            
            return {
                'success': True,
                'message': "Connected to Zerodha",
                'user_id': self.user_id
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def disconnect(self):
        """
        Disconnect from Zerodha API
        
        Returns:
            dict: Disconnection status
        """
        self.access_token = None
        self.session_expiry = None
        self.user_id = None
        
        return {
            'success': True,
            'message': "Disconnected from Zerodha"
        }
    
    def _check_session(self):
        """
        Check if session is valid
        
        Returns:
            bool: True if session is valid, False otherwise
        """
        if not self.access_token or not self.session_expiry:
            return False
        
        return time.time() < self.session_expiry
    
    def get_profile(self):
        """
        Get user profile information
        
        Returns:
            dict: User profile details
        """
        if self.demo_mode:
            return {
                'success': True,
                'profile': {
                    'user_id': 'ZD0000',
                    'name': 'Demo User',
                    'email': 'demo@example.com',
                    'phone': '9999999999',
                    'pan': 'ABCDE1234F',
                    'account_type': 'individual'
                }
            }
        
        if not self._check_session():
            return {
                'success': False,
                'error': "Session expired. Please reconnect."
            }
        
        try:
            profile_endpoint = f"{self.base_url}/user/profile"
            headers = {
                'Authorization': f"token {self.api_key}:{self.access_token}"
            }
            
            # In production, make actual API call
            # response = requests.get(profile_endpoint, headers=headers)
            # if response.status_code == 200:
            #     return {
            #         'success': True,
            #         'profile': response.json().get('data')
            #     }
            # else:
            #     return {
            #         'success': False,
            #         'error': response.json().get('error', 'Failed to fetch profile')
            #     }
            
            # For development without actual API
            return {
                'success': True,
                'profile': {
                    'user_id': self.user_id,
                    'name': 'Sample User',
                    'email': 'user@example.com',
                    'phone': '9876543210',
                    'pan': 'ABCPD1234Z',
                    'account_type': 'individual'
                }
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_holdings(self):
        """
        Get user's holdings
        
        Returns:
            dict: List of holdings
        """
        if self.demo_mode:
            return {
                'success': True,
                'holdings': self.demo_portfolio['holdings']
            }
        
        if not self._check_session():
            return {
                'success': False,
                'error': "Session expired. Please reconnect."
            }
        
        try:
            holdings_endpoint = f"{self.base_url}/portfolio/holdings"
            headers = {
                'Authorization': f"token {self.api_key}:{self.access_token}"
            }
            
            # In production, make actual API call
            # response = requests.get(holdings_endpoint, headers=headers)
            # if response.status_code == 200:
            #     return {
            #         'success': True,
            #         'holdings': response.json().get('data')
            #     }
            # else:
            #     return {
            #         'success': False,
            #         'error': response.json().get('error', 'Failed to fetch holdings')
            #     }
            
            # For development without actual API
            return {
                'success': True,
                'holdings': self.demo_portfolio['holdings']
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_positions(self):
        """
        Get user's current positions
        
        Returns:
            dict: List of open positions
        """
        if self.demo_mode:
            return {
                'success': True,
                'positions': self.demo_portfolio['positions']
            }
        
        if not self._check_session():
            return {
                'success': False,
                'error': "Session expired. Please reconnect."
            }
        
        try:
            positions_endpoint = f"{self.base_url}/portfolio/positions"
            headers = {
                'Authorization': f"token {self.api_key}:{self.access_token}"
            }
            
            # In production, make actual API call
            # response = requests.get(positions_endpoint, headers=headers)
            # if response.status_code == 200:
            #     return {
            #         'success': True,
            #         'positions': response.json().get('data')
            #     }
            # else:
            #     return {
            #         'success': False,
            #         'error': response.json().get('error', 'Failed to fetch positions')
            #     }
            
            # For development without actual API
            return {
                'success': True,
                'positions': self.demo_portfolio['positions']
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_margin(self):
        """
        Get user's margin details
        
        Returns:
            dict: Margin information
        """
        if self.demo_mode:
            return {
                'success': True,
                'margins': self.demo_portfolio['margins']
            }
        
        if not self._check_session():
            return {
                'success': False,
                'error': "Session expired. Please reconnect."
            }
        
        try:
            margin_endpoint = f"{self.base_url}/user/margins"
            headers = {
                'Authorization': f"token {self.api_key}:{self.access_token}"
            }
            
            # In production, make actual API call
            # response = requests.get(margin_endpoint, headers=headers)
            # if response.status_code == 200:
            #     return {
            #         'success': True,
            #         'margins': response.json().get('data')
            #     }
            # else:
            #     return {
            #         'success': False,
            #         'error': response.json().get('error', 'Failed to fetch margins')
            #     }
            
            # For development without actual API
            return {
                'success': True,
                'margins': self.demo_portfolio['margins']
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def place_order(self, order_params):
        """
        Place a new order
        
        Args:
            order_params (dict): Order parameters
            
        Returns:
            dict: Order status and details
        """
        required_params = ['tradingsymbol', 'exchange', 'transaction_type', 
                          'quantity', 'product', 'order_type']
        
        for param in required_params:
            if param not in order_params:
                return {
                    'success': False,
                    'error': f"Missing required parameter: {param}"
                }
        
        if self.demo_mode:
            return {
                'success': True,
                'order_id': f"demo_order_{int(time.time())}",
                'status': 'PENDING'
            }
        
        if not self._check_session():
            return {
                'success': False,
                'error': "Session expired. Please reconnect."
            }
        
        try:
            order_endpoint = f"{self.base_url}/orders/regular"
            headers = {
                'Authorization': f"token {self.api_key}:{self.access_token}"
            }
            
            # In production, make actual API call
            # response = requests.post(order_endpoint, data=order_params, headers=headers)
            # if response.status_code == 200:
            #     data = response.json()
            #     return {
            #         'success': True,
            #         'order_id': data.get('data', {}).get('order_id'),
            #         'status': 'PENDING'
            #     }
            # else:
            #     return {
            #         'success': False,
            #         'error': response.json().get('error', 'Failed to place order')
            #     }
            
            # For development without actual API
            return {
                'success': True,
                'order_id': f"order_{int(time.time())}",
                'status': 'PENDING'
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_order_status(self, order_id):
        """
        Get status of a specific order
        
        Args:
            order_id (str): Order identifier
            
        Returns:
            dict: Order status and details
        """
        if self.demo_mode:
            return {
                'success': True,
                'order': {
                    'order_id': order_id,
                    'status': 'COMPLETE',
                    'tradingsymbol': 'RELIANCE',
                    'exchange': 'NSE',
                    'transaction_type': 'BUY',
                    'quantity': 10,
                    'price': 2650.75,
                    'product': 'CNC',
                    'order_type': 'MARKET',
                    'average_price': 2650.75,
                    'filled_quantity': 10
                }
            }
        
        if not self._check_session():
            return {
                'success': False,
                'error': "Session expired. Please reconnect."
            }
        
        try:
            order_endpoint = f"{self.base_url}/orders/{order_id}"
            headers = {
                'Authorization': f"token {self.api_key}:{self.access_token}"
            }
            
            # In production, make actual API call
            # response = requests.get(order_endpoint, headers=headers)
            # if response.status_code == 200:
            #     return {
            #         'success': True,
            #         'order': response.json().get('data')
            #     }
            # else:
            #     return {
            #         'success': False,
            #         'error': response.json().get('error', 'Failed to get order status')
            #     }
            
            # For development without actual API
            return {
                'success': True,
                'order': {
                    'order_id': order_id,
                    'status': 'COMPLETE',
                    'tradingsymbol': 'RELIANCE',
                    'exchange': 'NSE',
                    'transaction_type': 'BUY',
                    'quantity': 10,
                    'price': 2650.75,
                    'product': 'CNC',
                    'order_type': 'MARKET',
                    'average_price': 2650.75,
                    'filled_quantity': 10
                }
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_order_history(self):
        """
        Get history of orders
        
        Returns:
            dict: List of historical orders
        """
        if self.demo_mode:
            return {
                'success': True,
                'orders': [
                    {
                        'order_id': 'demo_order_1',
                        'status': 'COMPLETE',
                        'tradingsymbol': 'RELIANCE',
                        'exchange': 'NSE',
                        'transaction_type': 'BUY',
                        'quantity': 10,
                        'price': 2650.75,
                        'product': 'CNC',
                        'order_type': 'MARKET',
                        'average_price': 2650.75,
                        'filled_quantity': 10,
                        'order_timestamp': '2023-04-01 10:30:00'
                    },
                    {
                        'order_id': 'demo_order_2',
                        'status': 'COMPLETE',
                        'tradingsymbol': 'HDFCBANK',
                        'exchange': 'NSE',
                        'transaction_type': 'BUY',
                        'quantity': 15,
                        'price': 1600.25,
                        'product': 'CNC',
                        'order_type': 'LIMIT',
                        'average_price': 1600.25,
                        'filled_quantity': 15,
                        'order_timestamp': '2023-04-05 11:15:00'
                    }
                ]
            }
        
        if not self._check_session():
            return {
                'success': False,
                'error': "Session expired. Please reconnect."
            }
        
        try:
            orders_endpoint = f"{self.base_url}/orders"
            headers = {
                'Authorization': f"token {self.api_key}:{self.access_token}"
            }
            
            # In production, make actual API call
            # response = requests.get(orders_endpoint, headers=headers)
            # if response.status_code == 200:
            #     return {
            #         'success': True,
            #         'orders': response.json().get('data')
            #     }
            # else:
            #     return {
            #         'success': False,
            #         'error': response.json().get('error', 'Failed to get order history')
            #     }
            
            # For development without actual API
            return {
                'success': True,
                'orders': [
                    {
                        'order_id': 'order_1',
                        'status': 'COMPLETE',
                        'tradingsymbol': 'RELIANCE',
                        'exchange': 'NSE',
                        'transaction_type': 'BUY',
                        'quantity': 10,
                        'price': 2650.75,
                        'product': 'CNC',
                        'order_type': 'MARKET',
                        'average_price': 2650.75,
                        'filled_quantity': 10,
                        'order_timestamp': '2023-04-01 10:30:00'
                    },
                    {
                        'order_id': 'order_2',
                        'status': 'COMPLETE',
                        'tradingsymbol': 'HDFCBANK',
                        'exchange': 'NSE',
                        'transaction_type': 'BUY',
                        'quantity': 15,
                        'price': 1600.25,
                        'product': 'CNC',
                        'order_type': 'LIMIT',
                        'average_price': 1600.25,
                        'filled_quantity': 15,
                        'order_timestamp': '2023-04-05 11:15:00'
                    }
                ]
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def modify_order(self, order_id, params):
        """
        Modify an existing order
        
        Args:
            order_id (str): Order identifier
            params (dict): Parameters to modify
            
        Returns:
            dict: Updated order status
        """
        if self.demo_mode:
            return {
                'success': True,
                'order_id': order_id,
                'status': 'PENDING'
            }
        
        if not self._check_session():
            return {
                'success': False,
                'error': "Session expired. Please reconnect."
            }
        
        try:
            modify_endpoint = f"{self.base_url}/orders/{order_id}"
            headers = {
                'Authorization': f"token {self.api_key}:{self.access_token}"
            }
            
            # In production, make actual API call
            # response = requests.put(modify_endpoint, data=params, headers=headers)
            # if response.status_code == 200:
            #     data = response.json()
            #     return {
            #         'success': True,
            #         'order_id': order_id,
            #         'status': 'PENDING'
            #     }
            # else:
            #     return {
            #         'success': False,
            #         'error': response.json().get('error', 'Failed to modify order')
            #     }
            
            # For development without actual API
            return {
                'success': True,
                'order_id': order_id,
                'status': 'PENDING'
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def cancel_order(self, order_id):
        """
        Cancel an existing order
        
        Args:
            order_id (str): Order identifier
            
        Returns:
            dict: Cancellation status
        """
        if self.demo_mode:
            return {
                'success': True,
                'order_id': order_id,
                'status': 'CANCELLED'
            }
        
        if not self._check_session():
            return {
                'success': False,
                'error': "Session expired. Please reconnect."
            }
        
        try:
            cancel_endpoint = f"{self.base_url}/orders/{order_id}"
            headers = {
                'Authorization': f"token {self.api_key}:{self.access_token}"
            }
            
            # In production, make actual API call
            # response = requests.delete(cancel_endpoint, headers=headers)
            # if response.status_code == 200:
            #     data = response.json()
            #     return {
            #         'success': True,
            #         'order_id': order_id,
            #         'status': 'CANCELLED'
            #     }
            # else:
            #     return {
            #         'success': False,
            #         'error': response.json().get('error', 'Failed to cancel order')
            #     }
            
            # For development without actual API
            return {
                'success': True,
                'order_id': order_id,
                'status': 'CANCELLED'
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }