import os
import requests
import json
import pandas as pd
from datetime import datetime

class BrokerService:
    def __init__(self):
        self.icici_api_key = os.getenv('ICICI_API_KEY')
        self.icici_api_secret = os.getenv('ICICI_API_SECRET')
        self.kotak_api_key = os.getenv('KOTAK_API_KEY')
        self.kotak_api_secret = os.getenv('KOTAK_API_SECRET')
        
        # Current broker connection
        self.connected_broker = None
        self.session_token = None
        self.user_id = None
        
        # Demo mode flag - for testing without actual broker connections
        self.demo_mode = True if not (self.icici_api_key and self.kotak_api_key) else False
        
        # Demo portfolio data
        self.demo_portfolio = {
            'holdings': [
                {
                    'symbol': 'RELIANCE',
                    'quantity': 10,
                    'avg_price': 2500.50,
                    'current_price': 2650.75,
                    'pnl': 1502.50,
                    'pnl_percent': 6.01
                },
                {
                    'symbol': 'HDFCBANK',
                    'quantity': 15,
                    'avg_price': 1600.25,
                    'current_price': 1550.50,
                    'pnl': -744.75,
                    'pnl_percent': -3.11
                },
                {
                    'symbol': 'TCS',
                    'quantity': 5,
                    'avg_price': 3400.00,
                    'current_price': 3600.25,
                    'pnl': 1001.25,
                    'pnl_percent': 5.89
                },
                {
                    'symbol': 'INFY',
                    'quantity': 20,
                    'avg_price': 1500.75,
                    'current_price': 1480.00,
                    'pnl': -415.00,
                    'pnl_percent': -1.38
                },
                {
                    'symbol': 'BAJFINANCE',
                    'quantity': 8,
                    'avg_price': 7200.50,
                    'current_price': 7350.25,
                    'pnl': 1198.00,
                    'pnl_percent': 2.08
                }
            ],
            'margin': {
                'total_margin': 500000.00,
                'used_margin': 350000.00,
                'available_margin': 150000.00,
                'margin_used_percent': 70.00
            },
            'positions': [
                {
                    'symbol': 'NIFTY APR FUT',
                    'qty': 75,
                    'buy_price': 22450.00,
                    'current_price': 22500.00,
                    'pnl': 3750.00,
                    'margin_used': 225000.00
                },
                {
                    'symbol': 'BANKNIFTY APR FUT',
                    'qty': 25,
                    'buy_price': 47500.00,
                    'current_price': 47400.00,
                    'pnl': -2500.00,
                    'margin_used': 125000.00
                }
            ]
        }
    
    def connect(self, broker, credentials):
        """
        Connect to broker API
        
        Args:
            broker (str): Broker name ('icici' or 'kotak')
            credentials (dict): Login credentials
            
        Returns:
            dict: Connection result
        """
        if self.demo_mode:
            self.connected_broker = broker
            self.session_token = "demo_session_token"
            self.user_id = "demo_user"
            return {
                "success": True,
                "message": f"Connected to {broker} in demo mode",
                "broker": broker,
                "user_id": self.user_id
            }
        
        if broker.lower() == 'icici':
            return self._connect_icici(credentials)
        elif broker.lower() == 'kotak':
            return self._connect_kotak(credentials)
        else:
            return {
                "success": False,
                "error": f"Unsupported broker: {broker}"
            }
    
    def _connect_icici(self, credentials):
        """Connect to ICICI Direct API"""
        try:
            api_key = self.icici_api_key
            api_secret = self.icici_api_secret
            
            if not api_key or not api_secret:
                return {
                    "success": False,
                    "error": "ICICI API credentials not configured"
                }
            
            # ICICI Direct API endpoint for login
            endpoint = "https://api.icicidirect.com/apiuser/login" # Example endpoint
            
            # Prepare login data
            login_data = {
                "api_key": api_key,
                "api_secret": api_secret,
                "user_id": credentials.get('user_id'),
                "password": credentials.get('password')
            }
            
            # TODO: In production, make actual API call
            # response = requests.post(endpoint, json=login_data)
            # response_data = response.json()
            
            # For development without actual API
            response_data = {
                "success": True,
                "session_token": "sample_icici_session_token",
                "user_id": credentials.get('user_id')
            }
            
            if response_data.get('success'):
                self.connected_broker = 'icici'
                self.session_token = response_data.get('session_token')
                self.user_id = response_data.get('user_id')
                
                return {
                    "success": True,
                    "message": "Connected to ICICI Direct",
                    "broker": "icici",
                    "user_id": self.user_id
                }
            else:
                return {
                    "success": False,
                    "error": response_data.get('error', 'Unknown error')
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def _connect_kotak(self, credentials):
        """Connect to Kotak Securities API"""
        try:
            api_key = self.kotak_api_key
            api_secret = self.kotak_api_secret
            
            if not api_key or not api_secret:
                return {
                    "success": False,
                    "error": "Kotak API credentials not configured"
                }
            
            # Kotak Securities API endpoint for login
            endpoint = "https://tradeapi.kotaksecurities.com/apim/login" # Example endpoint
            
            # Prepare login data
            login_data = {
                "api_key": api_key,
                "api_secret": api_secret,
                "user_id": credentials.get('user_id'),
                "password": credentials.get('password')
            }
            
            # TODO: In production, make actual API call
            # response = requests.post(endpoint, json=login_data)
            # response_data = response.json()
            
            # For development without actual API
            response_data = {
                "success": True,
                "session_token": "sample_kotak_session_token",
                "user_id": credentials.get('user_id')
            }
            
            if response_data.get('success'):
                self.connected_broker = 'kotak'
                self.session_token = response_data.get('session_token')
                self.user_id = response_data.get('user_id')
                
                return {
                    "success": True,
                    "message": "Connected to Kotak Securities",
                    "broker": "kotak",
                    "user_id": self.user_id
                }
            else:
                return {
                    "success": False,
                    "error": response_data.get('error', 'Unknown error')
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def get_portfolio(self):
        """
        Get user's portfolio from broker
        
        Returns:
            dict: Portfolio data including holdings, positions, and margin details
        """
        if self.demo_mode or not self.connected_broker:
            return self.demo_portfolio
        
        if self.connected_broker == 'icici':
            return self._get_icici_portfolio()
        elif self.connected_broker == 'kotak':
            return self._get_kotak_portfolio()
        else:
            return {
                "error": "No broker connected"
            }
    
    def _get_icici_portfolio(self):
        """Get portfolio from ICICI Direct"""
        try:
            if not self.session_token:
                return {"error": "Not logged in to ICICI Direct"}
            
            # TODO: In production, make actual API call to get portfolio
            # Holdings endpoint
            # holdings_endpoint = "https://api.icicidirect.com/api/holdings"
            # margin_endpoint = "https://api.icicidirect.com/api/margin"
            # positions_endpoint = "https://api.icicidirect.com/api/positions"
            
            # headers = {
            #     "Authorization": f"Bearer {self.session_token}",
            #     "Content-Type": "application/json"
            # }
            
            # holdings_response = requests.get(holdings_endpoint, headers=headers)
            # margin_response = requests.get(margin_endpoint, headers=headers)
            # positions_response = requests.get(positions_endpoint, headers=headers)
            
            # Return demo data for now
            return self.demo_portfolio
            
        except Exception as e:
            return {"error": str(e)}
    
    def _get_kotak_portfolio(self):
        """Get portfolio from Kotak Securities"""
        try:
            if not self.session_token:
                return {"error": "Not logged in to Kotak Securities"}
            
            # TODO: In production, make actual API call to get portfolio
            # Holdings endpoint
            # holdings_endpoint = "https://tradeapi.kotaksecurities.com/apim/holdings"
            # margin_endpoint = "https://tradeapi.kotaksecurities.com/apim/margin"
            # positions_endpoint = "https://tradeapi.kotaksecurities.com/apim/positions"
            
            # headers = {
            #     "Authorization": f"Bearer {self.session_token}",
            #     "Content-Type": "application/json"
            # }
            
            # holdings_response = requests.get(holdings_endpoint, headers=headers)
            # margin_response = requests.get(margin_endpoint, headers=headers)
            # positions_response = requests.get(positions_endpoint, headers=headers)
            
            # Return demo data for now
            return self.demo_portfolio
            
        except Exception as e:
            return {"error": str(e)}