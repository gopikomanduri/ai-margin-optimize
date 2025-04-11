import os
import requests
import json
import time
import base64
import hashlib
from services.broker_interface import BrokerInterface

class FYERSAdapter(BrokerInterface):
    """
    Implementation of BrokerInterface for FYERS API
    """
    
    def __init__(self, config=None):
        """
        Initialize FYERS adapter
        
        Args:
            config (dict, optional): Configuration for the adapter
        """
        self.app_id = os.getenv('FYERS_APP_ID')
        self.app_secret = os.getenv('FYERS_APP_SECRET')
        
        if config is None:
            config = {}
            
        self.base_url = config.get('base_url', 'https://api.fyers.in/api/v2')
        
        # Session handling
        self.access_token = None
        self.auth_code = None
        self.session_expiry = None
        self.user_id = None
        
        # Demo mode flag - for testing without actual FYERS connections
        self.demo_mode = True if not self.app_id else False
        
        # Demo portfolio data (similar structure to Zerodha for consistency)
        self.demo_portfolio = {
            'holdings': [
                {
                    'symbol': 'NSE:RELIANCE-EQ',
                    'exchange': 'NSE',
                    'isin': 'INE002A01018',
                    'quantity': 10,
                    'avg_price': 2500.50,
                    'current_price': 2650.75,
                    'pnl': 1502.50,
                    'pnl_percent': 6.01
                },
                {
                    'symbol': 'NSE:HDFCBANK-EQ',
                    'exchange': 'NSE',
                    'isin': 'INE040A01034',
                    'quantity': 15,
                    'avg_price': 1600.25,
                    'current_price': 1550.50,
                    'pnl': -744.75,
                    'pnl_percent': -3.11
                },
                {
                    'symbol': 'NSE:TCS-EQ',
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
                    'symbol': 'NSE:NIFTY24APRFUT',
                    'exchange': 'NSE',
                    'quantity': 75,
                    'avg_price': 22450.00,
                    'current_price': 22500.00,
                    'pnl': 3750.00,
                    'product_type': 'MARGIN'
                },
                {
                    'symbol': 'NSE:BANKNIFTY24APRFUT',
                    'exchange': 'NSE',
                    'quantity': 25,
                    'avg_price': 47500.00,
                    'current_price': 47400.00,
                    'pnl': -2500.00,
                    'product_type': 'MARGIN'
                }
            ],
            'margins': {
                'total': 500000.00,
                'used': {
                    'cash': 100000.00,
                    'margin_used': 250000.00,
                    'premium_used': 0.00,
                    'total_used': 350000.00
                },
                'available': {
                    'cash_available': 150000.00,
                    'total_available': 150000.00
                }
            }
        }
    
    def connect(self, credentials):
        """
        Connect to FYERS API
        
        Args:
            credentials (dict): Authentication credentials
            
        Returns:
            dict: Connection status and details
        """
        if self.demo_mode:
            self.user_id = "FY0000"
            self.access_token = "demo_fyers_token"
            self.session_expiry = time.time() + 24*3600  # 24 hours from now
            
            return {
                'success': True,
                'message': "Connected to FYERS in demo mode",
                'user_id': self.user_id
            }
        
        try:
            # Step 1: Get auth code if not provided
            auth_code = credentials.get('auth_code')
            
            if not auth_code:
                # In production, direct the user to FYERS login page to get auth code
                return {
                    'success': False,
                    'error': "Authorization code required for authentication",
                    'auth_url': f"https://api.fyers.in/api/v2/generate-authcode?client_id={self.app_id}&redirect_uri={credentials.get('redirect_uri', 'https://your-redirect-url.com')}&response_type=code"
                }
            
            # Step 2: Exchange auth code for access token
            token_endpoint = f"{self.base_url}/validate-authcode"
            token_payload = {
                "grant_type": "authorization_code",
                "appIdHash": self._generate_app_hash(auth_code),
                "code": auth_code
            }
            
            # In production, make actual API call
            # response = requests.post(token_endpoint, json=token_payload)
            # if response.status_code == 200:
            #     data = response.json()
            #     if data.get('s') == 'ok':
            #         self.access_token = data.get('access_token')
            #         self.user_id = self.app_id.split('-')[0]
            #         self.session_expiry = time.time() + 24*3600  # 24 hours from now
            #         return {
            #             'success': True,
            #             'message': "Connected to FYERS",
            #             'user_id': self.user_id
            #         }
            #     else:
            #         return {
            #             'success': False,
            #             'error': data.get('message', 'Authentication failed')
            #         }
            # else:
            #     return {
            #         'success': False,
            #         'error': 'Failed to connect to FYERS API'
            #     }
            
            # For development without actual API
            self.access_token = "sample_fyers_token"
            self.user_id = "FY1234"
            self.session_expiry = time.time() + 24*3600  # 24 hours from now
            
            return {
                'success': True,
                'message': "Connected to FYERS",
                'user_id': self.user_id
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def _generate_app_hash(self, auth_code):
        """
        Generate hash for FYERS API authentication
        
        Args:
            auth_code (str): Authentication code
            
        Returns:
            str: Hash string
        """
        key = f"{self.app_id}:{self.app_secret}:{auth_code}"
        hash_obj = hashlib.sha256(key.encode())
        return hash_obj.hexdigest()
    
    def disconnect(self):
        """
        Disconnect from FYERS API
        
        Returns:
            dict: Disconnection status
        """
        if not self.access_token:
            return {
                'success': True,
                'message': "Already disconnected from FYERS"
            }
        
        if self.demo_mode:
            self.access_token = None
            self.session_expiry = None
            self.user_id = None
            
            return {
                'success': True,
                'message': "Disconnected from FYERS in demo mode"
            }
        
        try:
            # In FYERS, there's no explicit logout API, but we can invalidate the token locally
            self.access_token = None
            self.session_expiry = None
            self.user_id = None
            
            return {
                'success': True,
                'message': "Disconnected from FYERS"
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
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
                    'user_id': 'FY0000',
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
            profile_endpoint = f"{self.base_url}/profile"
            headers = {
                'Authorization': f"{self.access_token}"
            }
            
            # In production, make actual API call
            # response = requests.get(profile_endpoint, headers=headers)
            # if response.status_code == 200:
            #     data = response.json()
            #     if data.get('s') == 'ok':
            #         return {
            #             'success': True,
            #             'profile': data.get('data')
            #         }
            #     else:
            #         return {
            #             'success': False,
            #             'error': data.get('message', 'Failed to fetch profile')
            #         }
            # else:
            #     return {
            #         'success': False,
            #         'error': 'Failed to fetch profile'
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
            holdings_endpoint = f"{self.base_url}/holdings"
            headers = {
                'Authorization': f"{self.access_token}"
            }
            
            # In production, make actual API call
            # response = requests.get(holdings_endpoint, headers=headers)
            # if response.status_code == 200:
            #     data = response.json()
            #     if data.get('s') == 'ok':
            #         return {
            #             'success': True,
            #             'holdings': data.get('holdings')
            #         }
            #     else:
            #         return {
            #             'success': False,
            #             'error': data.get('message', 'Failed to fetch holdings')
            #         }
            # else:
            #     return {
            #         'success': False,
            #         'error': 'Failed to fetch holdings'
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
            positions_endpoint = f"{self.base_url}/positions"
            headers = {
                'Authorization': f"{self.access_token}"
            }
            
            # In production, make actual API call
            # response = requests.get(positions_endpoint, headers=headers)
            # if response.status_code == 200:
            #     data = response.json()
            #     if data.get('s') == 'ok':
            #         return {
            #             'success': True,
            #             'positions': data.get('netPositions')
            #         }
            #     else:
            #         return {
            #             'success': False,
            #             'error': data.get('message', 'Failed to fetch positions')
            #         }
            # else:
            #     return {
            #         'success': False,
            #         'error': 'Failed to fetch positions'
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
            funds_endpoint = f"{self.base_url}/funds"
            headers = {
                'Authorization': f"{self.access_token}"
            }
            
            # In production, make actual API call
            # response = requests.get(funds_endpoint, headers=headers)
            # if response.status_code == 200:
            #     data = response.json()
            #     if data.get('s') == 'ok':
            #         # Convert FYERS margin format to our standard format
            #         fund_data = data.get('fund_limit', {})
            #         margins = {
            #             'total': fund_data.get('total_limit', 0),
            #             'used': {
            #                 'cash': fund_data.get('utilised.cash', 0),
            #                 'margin_used': fund_data.get('utilised.margin', 0),
            #                 'premium_used': fund_data.get('utilised.premium', 0),
            #                 'total_used': fund_data.get('utilised.total', 0)
            #             },
            #             'available': {
            #                 'cash_available': fund_data.get('available.cash', 0),
            #                 'total_available': fund_data.get('available.total', 0)
            #             }
            #         }
            #         return {
            #             'success': True,
            #             'margins': margins
            #         }
            #     else:
            #         return {
            #             'success': False,
            #             'error': data.get('message', 'Failed to fetch funds')
            #         }
            # else:
            #     return {
            #         'success': False,
            #         'error': 'Failed to fetch funds'
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
        # FYERS required parameters
        required_params = ['symbol', 'qty', 'type', 'side', 'productType']
        
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
            order_endpoint = f"{self.base_url}/orders"
            headers = {
                'Authorization': f"{self.access_token}",
                'Content-Type': 'application/json'
            }
            
            # In production, make actual API call
            # response = requests.post(order_endpoint, json=order_params, headers=headers)
            # if response.status_code == 200:
            #     data = response.json()
            #     if data.get('s') == 'ok':
            #         return {
            #             'success': True,
            #             'order_id': data.get('id'),
            #             'status': 'PENDING'
            #         }
            #     else:
            #         return {
            #             'success': False,
            #             'error': data.get('message', 'Failed to place order')
            #         }
            # else:
            #     return {
            #         'success': False,
            #         'error': 'Failed to place order'
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
                    'id': order_id,
                    'status': 2,  # 2 = Completed in FYERS
                    'symbol': 'NSE:RELIANCE-EQ',
                    'qty': 10,
                    'type': 1,  # 1 = Limit in FYERS
                    'side': 1,  # 1 = Buy in FYERS
                    'avgPrice': 2650.75,
                    'productType': 'CNC',
                    'filledQty': 10,
                    'tradedPrice': 2650.75
                }
            }
        
        if not self._check_session():
            return {
                'success': False,
                'error': "Session expired. Please reconnect."
            }
        
        try:
            order_endpoint = f"{self.base_url}/orders?id={order_id}"
            headers = {
                'Authorization': f"{self.access_token}"
            }
            
            # In production, make actual API call
            # response = requests.get(order_endpoint, headers=headers)
            # if response.status_code == 200:
            #     data = response.json()
            #     if data.get('s') == 'ok' and data.get('orderBook'):
            #         orders = data.get('orderBook', [])
            #         for order in orders:
            #             if order.get('id') == order_id:
            #                 return {
            #                     'success': True,
            #                     'order': order
            #                 }
            #         return {
            #             'success': False,
            #             'error': f"Order {order_id} not found"
            #         }
            #     else:
            #         return {
            #             'success': False,
            #             'error': data.get('message', 'Failed to get order status')
            #         }
            # else:
            #     return {
            #         'success': False,
            #         'error': 'Failed to get order status'
            #     }
            
            # For development without actual API
            return {
                'success': True,
                'order': {
                    'id': order_id,
                    'status': 2,  # 2 = Completed in FYERS
                    'symbol': 'NSE:RELIANCE-EQ',
                    'qty': 10,
                    'type': 1,  # 1 = Limit in FYERS
                    'side': 1,  # 1 = Buy in FYERS
                    'avgPrice': 2650.75,
                    'productType': 'CNC',
                    'filledQty': 10,
                    'tradedPrice': 2650.75
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
                        'id': 'demo_order_1',
                        'status': 2,  # 2 = Completed in FYERS
                        'symbol': 'NSE:RELIANCE-EQ',
                        'qty': 10,
                        'type': 1,  # 1 = Limit in FYERS
                        'side': 1,  # 1 = Buy in FYERS
                        'avgPrice': 2650.75,
                        'productType': 'CNC',
                        'filledQty': 10,
                        'tradedPrice': 2650.75,
                        'orderDateTime': '2023-04-01 10:30:00'
                    },
                    {
                        'id': 'demo_order_2',
                        'status': 2,  # 2 = Completed in FYERS
                        'symbol': 'NSE:HDFCBANK-EQ',
                        'qty': 15,
                        'type': 1,  # 1 = Limit in FYERS
                        'side': 1,  # 1 = Buy in FYERS
                        'avgPrice': 1600.25,
                        'productType': 'CNC',
                        'filledQty': 15,
                        'tradedPrice': 1600.25,
                        'orderDateTime': '2023-04-05 11:15:00'
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
                'Authorization': f"{self.access_token}"
            }
            
            # In production, make actual API call
            # response = requests.get(orders_endpoint, headers=headers)
            # if response.status_code == 200:
            #     data = response.json()
            #     if data.get('s') == 'ok':
            #         return {
            #             'success': True,
            #             'orders': data.get('orderBook', [])
            #         }
            #     else:
            #         return {
            #             'success': False,
            #             'error': data.get('message', 'Failed to get order history')
            #         }
            # else:
            #     return {
            #         'success': False,
            #         'error': 'Failed to get order history'
            #     }
            
            # For development without actual API
            return {
                'success': True,
                'orders': [
                    {
                        'id': 'order_1',
                        'status': 2,  # 2 = Completed in FYERS
                        'symbol': 'NSE:RELIANCE-EQ',
                        'qty': 10,
                        'type': 1,  # 1 = Limit in FYERS
                        'side': 1,  # 1 = Buy in FYERS
                        'avgPrice': 2650.75,
                        'productType': 'CNC',
                        'filledQty': 10,
                        'tradedPrice': 2650.75,
                        'orderDateTime': '2023-04-01 10:30:00'
                    },
                    {
                        'id': 'order_2',
                        'status': 2,  # 2 = Completed in FYERS
                        'symbol': 'NSE:HDFCBANK-EQ',
                        'qty': 15,
                        'type': 1,  # 1 = Limit in FYERS
                        'side': 1,  # 1 = Buy in FYERS
                        'avgPrice': 1600.25,
                        'productType': 'CNC',
                        'filledQty': 15,
                        'tradedPrice': 1600.25,
                        'orderDateTime': '2023-04-05 11:15:00'
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
            modify_endpoint = f"{self.base_url}/orders"
            headers = {
                'Authorization': f"{self.access_token}",
                'Content-Type': 'application/json'
            }
            
            # Add the order_id to parameters
            params['id'] = order_id
            
            # In production, make actual API call
            # response = requests.put(modify_endpoint, json=params, headers=headers)
            # if response.status_code == 200:
            #     data = response.json()
            #     if data.get('s') == 'ok':
            #         return {
            #             'success': True,
            #             'order_id': order_id,
            #             'status': 'PENDING'
            #         }
            #     else:
            #         return {
            #             'success': False,
            #             'error': data.get('message', 'Failed to modify order')
            #         }
            # else:
            #     return {
            #         'success': False,
            #         'error': 'Failed to modify order'
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
            cancel_endpoint = f"{self.base_url}/orders"
            headers = {
                'Authorization': f"{self.access_token}",
                'Content-Type': 'application/json'
            }
            
            data = {
                'id': order_id
            }
            
            # In production, make actual API call
            # response = requests.delete(cancel_endpoint, json=data, headers=headers)
            # if response.status_code == 200:
            #     data = response.json()
            #     if data.get('s') == 'ok':
            #         return {
            #             'success': True,
            #             'order_id': order_id,
            #             'status': 'CANCELLED'
            #         }
            #     else:
            #         return {
            #             'success': False,
            #             'error': data.get('message', 'Failed to cancel order')
            #         }
            # else:
            #     return {
            #         'success': False,
            #         'error': 'Failed to cancel order'
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