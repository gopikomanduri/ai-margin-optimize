import os
import requests
import json
import time
from datetime import datetime
from services.pledge_interface import PledgeInterface

class CDSLPledgeService(PledgeInterface):
    """
    Implementation of PledgeInterface for CDSL EASIEST/TPIN flow
    """
    
    def __init__(self, config=None):
        """
        Initialize CDSL Pledge Service
        
        Args:
            config (dict, optional): Configuration settings
        """
        self.cdsl_api_key = os.getenv('CDSL_API_KEY')
        self.cdsl_api_secret = os.getenv('CDSL_API_SECRET')
        
        if config is None:
            config = {}
            
        self.base_url = config.get('base_url', 'https://cdslapiuat.cdslindi.co.in/cdsl/v1') # Example UAT URL
        self.client_id = config.get('client_id')
        self.dp_id = config.get('dp_id')
        
        # Demo mode flag - for testing without actual CDSL connections
        self.demo_mode = True if not self.cdsl_api_key else False
        
        # Session handling
        self.session_token = None
        self.session_expiry = None
        
        # Demo pledge data
        self.demo_pledged_holdings = [
            {
                'pledge_id': 'PL12345',
                'symbol': 'RELIANCE',
                'isin': 'INE002A01018',
                'quantity': 5,
                'pledge_date': '2023-04-01',
                'status': 'ACTIVE',
                'haircut': 0.20,
                'value': 132537.50,
                'collateral_value': 106030.00,
            },
            {
                'pledge_id': 'PL12346',
                'symbol': 'HDFCBANK',
                'isin': 'INE040A01034',
                'quantity': 8,
                'pledge_date': '2023-04-05',
                'status': 'ACTIVE',
                'haircut': 0.15,
                'value': 124040.00,
                'collateral_value': 105434.00,
            }
        ]
        
        # Demo pledge requests
        self.demo_pledge_requests = {}
        self.next_pledge_id = 'PL12347'
    
    def _generate_pledge_id(self):
        """Generate a new pledge ID for demo mode"""
        pledge_id = self.next_pledge_id
        # Increment the ID for next request
        id_num = int(pledge_id[2:])
        self.next_pledge_id = f"PL{id_num + 1}"
        return pledge_id
    
    def _authenticate(self):
        """
        Authenticate with CDSL API
        
        Returns:
            bool: True if authentication successful, False otherwise
        """
        if self.demo_mode:
            self.session_token = "demo_cdsl_session_token"
            self.session_expiry = time.time() + 3600  # 1 hour from now
            return True
            
        try:
            # Example authentication endpoint
            endpoint = f"{self.base_url}/auth"
            
            # Prepare authentication data
            auth_data = {
                "api_key": self.cdsl_api_key,
                "api_secret": self.cdsl_api_secret,
                "client_id": self.client_id,
                "dp_id": self.dp_id
            }
            
            # TODO: In production, make actual API call
            # response = requests.post(endpoint, json=auth_data)
            # if response.status_code == 200:
            #     data = response.json()
            #     self.session_token = data.get('token')
            #     self.session_expiry = time.time() + data.get('expires_in', 3600)
            #     return True
            
            # For development without actual API
            self.session_token = "sample_cdsl_session_token"
            self.session_expiry = time.time() + 3600  # 1 hour from now
            return True
            
        except Exception as e:
            print(f"CDSL Authentication error: {str(e)}")
            return False
    
    def _is_session_valid(self):
        """
        Check if current session is valid
        
        Returns:
            bool: True if session is valid, False otherwise
        """
        if not self.session_token or not self.session_expiry:
            return False
        
        # Check if token has expired
        return time.time() < self.session_expiry
    
    def _ensure_authenticated(self):
        """
        Ensure we have a valid authentication session
        
        Returns:
            bool: True if authenticated, False otherwise
        """
        if self._is_session_valid():
            return True
        
        return self._authenticate()
    
    def create_pledge_request(self, stock_id, quantity, reason=None):
        """
        Create a new pledge request with CDSL
        
        Args:
            stock_id (str): Stock identifier (ISIN or Symbol)
            quantity (int): Number of shares to pledge
            reason (str, optional): Reason for pledging
            
        Returns:
            dict: Pledge request status and details
        """
        if self.demo_mode:
            # Generate dummy pledge request for demo
            pledge_id = self._generate_pledge_id()
            
            # Store the pledge request
            self.demo_pledge_requests[pledge_id] = {
                'pledge_id': pledge_id,
                'symbol': stock_id,  # Assuming stock_id is symbol for demo
                'isin': f"IN{stock_id}12345",  # Dummy ISIN
                'quantity': quantity,
                'request_date': datetime.now().strftime('%Y-%m-%d'),
                'status': 'PENDING_AUTHORIZATION',
                'reason': reason
            }
            
            return {
                'success': True,
                'message': f"Pledge request created successfully. OTP has been sent to your registered mobile.",
                'pledge_id': pledge_id,
                'status': 'PENDING_AUTHORIZATION'
            }
        
        if not self._ensure_authenticated():
            return {
                'success': False,
                'error': "Authentication failed with CDSL"
            }
        
        try:
            # Example pledge request endpoint
            endpoint = f"{self.base_url}/pledge/create"
            
            # Prepare pledge data
            pledge_data = {
                "isin": stock_id if len(stock_id) == 12 else None,  # ISIN is 12 chars
                "symbol": None if len(stock_id) == 12 else stock_id,
                "quantity": quantity,
                "reason": reason,
                "client_id": self.client_id,
                "dp_id": self.dp_id
            }
            
            headers = {
                "Authorization": f"Bearer {self.session_token}",
                "Content-Type": "application/json"
            }
            
            # TODO: In production, make actual API call
            # response = requests.post(endpoint, json=pledge_data, headers=headers)
            # if response.status_code == 200:
            #     data = response.json()
            #     return {
            #         'success': True,
            #         'message': data.get('message'),
            #         'pledge_id': data.get('pledge_id'),
            #         'status': data.get('status')
            #     }
            # else:
            #     return {
            #         'success': False,
            #         'error': response.json().get('error', 'Unknown error')
            #     }
            
            # For development without actual API
            return {
                'success': True,
                'message': "Pledge request created successfully. OTP has been sent to your registered mobile.",
                'pledge_id': "PL12347",
                'status': "PENDING_AUTHORIZATION"
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def unpledge_request(self, pledge_id, quantity, reason=None):
        """
        Create an unpledge request with CDSL
        
        Args:
            pledge_id (str): Pledge identifier
            quantity (int): Number of shares to unpledge
            reason (str, optional): Reason for unpledging
            
        Returns:
            dict: Unpledge request status and details
        """
        if self.demo_mode:
            # Find the pledge in demo data
            found = False
            for pledge in self.demo_pledged_holdings:
                if pledge['pledge_id'] == pledge_id:
                    found = True
                    # Create unpledge request
                    unpledge_id = f"UP{pledge_id[2:]}"
                    
                    # Store the unpledge request
                    self.demo_pledge_requests[unpledge_id] = {
                        'unpledge_id': unpledge_id,
                        'pledge_id': pledge_id,
                        'symbol': pledge['symbol'],
                        'isin': pledge['isin'],
                        'quantity': min(quantity, pledge['quantity']),
                        'request_date': datetime.now().strftime('%Y-%m-%d'),
                        'status': 'PENDING_AUTHORIZATION',
                        'reason': reason
                    }
                    
                    return {
                        'success': True,
                        'message': f"Unpledge request created successfully. OTP has been sent to your registered mobile.",
                        'unpledge_id': unpledge_id,
                        'status': 'PENDING_AUTHORIZATION'
                    }
            
            if not found:
                return {
                    'success': False,
                    'error': f"Pledge ID {pledge_id} not found"
                }
        
        if not self._ensure_authenticated():
            return {
                'success': False,
                'error': "Authentication failed with CDSL"
            }
        
        try:
            # Example unpledge request endpoint
            endpoint = f"{self.base_url}/pledge/unpledge"
            
            # Prepare unpledge data
            unpledge_data = {
                "pledge_id": pledge_id,
                "quantity": quantity,
                "reason": reason,
                "client_id": self.client_id,
                "dp_id": self.dp_id
            }
            
            headers = {
                "Authorization": f"Bearer {self.session_token}",
                "Content-Type": "application/json"
            }
            
            # TODO: In production, make actual API call
            # response = requests.post(endpoint, json=unpledge_data, headers=headers)
            # if response.status_code == 200:
            #     data = response.json()
            #     return {
            #         'success': True,
            #         'message': data.get('message'),
            #         'unpledge_id': data.get('unpledge_id'),
            #         'status': data.get('status')
            #     }
            # else:
            #     return {
            #         'success': False,
            #         'error': response.json().get('error', 'Unknown error')
            #     }
            
            # For development without actual API
            return {
                'success': True,
                'message': "Unpledge request created successfully. OTP has been sent to your registered mobile.",
                'unpledge_id': f"UP{pledge_id[2:]}",
                'status': "PENDING_AUTHORIZATION"
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_pledge_status(self, pledge_id):
        """
        Get status of a specific pledge or unpledge request
        
        Args:
            pledge_id (str): Pledge/Unpledge identifier
            
        Returns:
            dict: Pledge status and details
        """
        if self.demo_mode:
            # Check if it's in the requests
            if pledge_id in self.demo_pledge_requests:
                return {
                    'success': True,
                    'pledge': self.demo_pledge_requests[pledge_id]
                }
            
            # Check if it's in the active pledges
            for pledge in self.demo_pledged_holdings:
                if pledge['pledge_id'] == pledge_id:
                    return {
                        'success': True,
                        'pledge': pledge
                    }
            
            return {
                'success': False,
                'error': f"Pledge ID {pledge_id} not found"
            }
        
        if not self._ensure_authenticated():
            return {
                'success': False,
                'error': "Authentication failed with CDSL"
            }
        
        try:
            # Example pledge status endpoint
            endpoint = f"{self.base_url}/pledge/status/{pledge_id}"
            
            headers = {
                "Authorization": f"Bearer {self.session_token}",
                "Content-Type": "application/json"
            }
            
            # TODO: In production, make actual API call
            # response = requests.get(endpoint, headers=headers)
            # if response.status_code == 200:
            #     data = response.json()
            #     return {
            #         'success': True,
            #         'pledge': data.get('pledge')
            #     }
            # else:
            #     return {
            #         'success': False,
            #         'error': response.json().get('error', 'Unknown error')
            #     }
            
            # For development without actual API
            return {
                'success': True,
                'pledge': {
                    'pledge_id': pledge_id,
                    'symbol': 'RELIANCE',
                    'isin': 'INE002A01018',
                    'quantity': 5,
                    'pledge_date': '2023-04-01',
                    'status': 'ACTIVE',
                    'haircut': 0.20,
                    'value': 132537.50,
                    'collateral_value': 106030.00,
                }
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_pledged_holdings(self):
        """
        Get all pledged holdings
        
        Returns:
            dict: List of pledged holdings
        """
        if self.demo_mode:
            return {
                'success': True,
                'pledges': self.demo_pledged_holdings
            }
        
        if not self._ensure_authenticated():
            return {
                'success': False,
                'error': "Authentication failed with CDSL"
            }
        
        try:
            # Example pledged holdings endpoint
            endpoint = f"{self.base_url}/pledge/holdings"
            
            headers = {
                "Authorization": f"Bearer {self.session_token}",
                "Content-Type": "application/json"
            }
            
            # TODO: In production, make actual API call
            # response = requests.get(endpoint, headers=headers)
            # if response.status_code == 200:
            #     data = response.json()
            #     return {
            #         'success': True,
            #         'pledges': data.get('pledges', [])
            #     }
            # else:
            #     return {
            #         'success': False,
            #         'error': response.json().get('error', 'Unknown error')
            #     }
            
            # For development without actual API
            return {
                'success': True,
                'pledges': [
                    {
                        'pledge_id': 'PL12345',
                        'symbol': 'RELIANCE',
                        'isin': 'INE002A01018',
                        'quantity': 5,
                        'pledge_date': '2023-04-01',
                        'status': 'ACTIVE',
                        'haircut': 0.20,
                        'value': 132537.50,
                        'collateral_value': 106030.00,
                    },
                    {
                        'pledge_id': 'PL12346',
                        'symbol': 'HDFCBANK',
                        'isin': 'INE040A01034',
                        'quantity': 8,
                        'pledge_date': '2023-04-05',
                        'status': 'ACTIVE',
                        'haircut': 0.15,
                        'value': 124040.00,
                        'collateral_value': 105434.00,
                    }
                ]
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def authorize_pledge(self, pledge_id, otp=None):
        """
        Authorize a pledge request using OTP
        
        Args:
            pledge_id (str): Pledge identifier
            otp (str, optional): OTP for authorization
            
        Returns:
            dict: Authorization status
        """
        if self.demo_mode:
            if pledge_id in self.demo_pledge_requests:
                request = self.demo_pledge_requests[pledge_id]
                
                # Validate OTP (in demo, any 6-digit OTP works)
                if not otp or len(otp) != 6 or not otp.isdigit():
                    return {
                        'success': False,
                        'error': "Invalid OTP. Please provide a valid 6-digit OTP."
                    }
                
                # Update status
                if pledge_id.startswith('PL'):
                    # It's a pledge request
                    request['status'] = 'COMPLETED'
                    
                    # Add to pledged holdings
                    self.demo_pledged_holdings.append({
                        'pledge_id': pledge_id,
                        'symbol': request['symbol'],
                        'isin': request['isin'],
                        'quantity': request['quantity'],
                        'pledge_date': datetime.now().strftime('%Y-%m-%d'),
                        'status': 'ACTIVE',
                        'haircut': 0.20,  # Default haircut
                        'value': request['quantity'] * 2650.75,  # Dummy value
                        'collateral_value': request['quantity'] * 2650.75 * 0.80,  # Value after haircut
                    })
                    
                elif pledge_id.startswith('UP'):
                    # It's an unpledge request
                    request['status'] = 'COMPLETED'
                    
                    # Update pledged holdings
                    pledge_id_to_update = request['pledge_id']
                    for i, pledge in enumerate(self.demo_pledged_holdings):
                        if pledge['pledge_id'] == pledge_id_to_update:
                            # Reduce quantity
                            pledge['quantity'] -= request['quantity']
                            
                            # Remove if quantity is 0
                            if pledge['quantity'] <= 0:
                                self.demo_pledged_holdings.pop(i)
                            break
                
                return {
                    'success': True,
                    'message': f"Pledge/Unpledge request {pledge_id} authorized successfully",
                    'status': 'COMPLETED'
                }
            
            return {
                'success': False,
                'error': f"Pledge ID {pledge_id} not found"
            }
        
        if not self._ensure_authenticated():
            return {
                'success': False,
                'error': "Authentication failed with CDSL"
            }
        
        try:
            # Example pledge authorization endpoint
            endpoint = f"{self.base_url}/pledge/authorize"
            
            # Prepare authorization data
            auth_data = {
                "pledge_id": pledge_id,
                "otp": otp,
                "client_id": self.client_id,
                "dp_id": self.dp_id
            }
            
            headers = {
                "Authorization": f"Bearer {self.session_token}",
                "Content-Type": "application/json"
            }
            
            # TODO: In production, make actual API call
            # response = requests.post(endpoint, json=auth_data, headers=headers)
            # if response.status_code == 200:
            #     data = response.json()
            #     return {
            #         'success': True,
            #         'message': data.get('message'),
            #         'status': data.get('status')
            #     }
            # else:
            #     return {
            #         'success': False,
            #         'error': response.json().get('error', 'Unknown error')
            #     }
            
            # For development without actual API
            return {
                'success': True,
                'message': f"Pledge/Unpledge request {pledge_id} authorized successfully",
                'status': 'COMPLETED'
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def request_pledge_otp(self, pledge_id):
        """
        Request an OTP for pledge authorization
        
        Args:
            pledge_id (str): Pledge identifier
            
        Returns:
            dict: OTP request status
        """
        if self.demo_mode:
            if pledge_id in self.demo_pledge_requests:
                return {
                    'success': True,
                    'message': "OTP sent to your registered mobile number",
                    'reference': f"OTP{pledge_id}"
                }
            
            return {
                'success': False,
                'error': f"Pledge ID {pledge_id} not found"
            }
        
        if not self._ensure_authenticated():
            return {
                'success': False,
                'error': "Authentication failed with CDSL"
            }
        
        try:
            # Example OTP request endpoint
            endpoint = f"{self.base_url}/pledge/request-otp"
            
            # Prepare OTP request data
            otp_request = {
                "pledge_id": pledge_id,
                "client_id": self.client_id,
                "dp_id": self.dp_id
            }
            
            headers = {
                "Authorization": f"Bearer {self.session_token}",
                "Content-Type": "application/json"
            }
            
            # TODO: In production, make actual API call
            # response = requests.post(endpoint, json=otp_request, headers=headers)
            # if response.status_code == 200:
            #     data = response.json()
            #     return {
            #         'success': True,
            #         'message': data.get('message'),
            #         'reference': data.get('reference')
            #     }
            # else:
            #     return {
            #         'success': False,
            #         'error': response.json().get('error', 'Unknown error')
            #     }
            
            # For development without actual API
            return {
                'success': True,
                'message': "OTP sent to your registered mobile number",
                'reference': f"OTP{pledge_id}"
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }