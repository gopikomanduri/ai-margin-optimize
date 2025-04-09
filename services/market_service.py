import os
import pandas as pd
import numpy as np
import yfinance as yf
from datetime import datetime, timedelta

class MarketService:
    def __init__(self):
        # Track market indices
        self.indices = {
            'NIFTY': '^NSEI',  # NSE NIFTY 50 Index
            'BANKNIFTY': '^NSEBANK',  # NSE Bank Index
            'SENSEX': '^BSESN'  # BSE SENSEX
        }
        
        # Track key macro indicators
        self.macro_indicators = {
            'INR/USD': 'INR=X',
            'Crude Oil': 'CL=F',
            'Gold': 'GC=F',
            'US10Y': '^TNX',
            'VIX': '^VIX'
        }
    
    def get_market_data(self, portfolio, period='1mo'):
        """
        Get market data for portfolio holdings
        
        Args:
            portfolio (dict): Portfolio with holdings
            period (str): Period for historical data (1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max)
            
        Returns:
            dict: Market data for portfolio holdings
        """
        market_data = {
            'holdings': {},
            'indices': {},
            'volatility': {},
            'correlation': {}
        }
        
        # Extract tickers from portfolio
        symbols = []
        for holding in portfolio.get('holdings', []):
            symbols.append(holding.get('symbol'))
        
        # Get data for portfolio holdings
        for symbol in symbols:
            try:
                # For Indian markets, append .NS for NSE stocks
                if not symbol.endswith('.NS') and not symbol.endswith('.BO'):
                    # Check if it's an NSE stock, otherwise assume BSE
                    ticker = yf.Ticker(f"{symbol}.NS")
                    if not ticker.info or ticker.info.get('symbol') is None:
                        ticker = yf.Ticker(f"{symbol}.BO")
                    else:
                        symbol = f"{symbol}.NS"
                else:
                    ticker = yf.Ticker(symbol)
                
                # Get historical data
                hist = ticker.history(period=period)
                
                if not hist.empty:
                    # Calculate daily returns
                    hist['Returns'] = hist['Close'].pct_change()
                    
                    # Calculate volatility (standard deviation of returns)
                    volatility = hist['Returns'].std() * np.sqrt(252)  # Annualized
                    
                    market_data['holdings'][symbol] = {
                        'history': hist.to_dict(orient='records'),
                        'current_price': float(hist['Close'].iloc[-1]) if not hist.empty else None,
                        'change_1d': float(hist['Close'].iloc[-1] - hist['Close'].iloc[-2]) if len(hist) > 1 else 0,
                        'change_percent_1d': float((hist['Close'].iloc[-1] / hist['Close'].iloc[-2] - 1) * 100) if len(hist) > 1 else 0,
                        'volume': int(hist['Volume'].iloc[-1]) if 'Volume' in hist and not hist.empty else 0
                    }
                    
                    market_data['volatility'][symbol] = float(volatility)
            
            except Exception as e:
                print(f"Error fetching market data for {symbol}: {str(e)}")
                market_data['holdings'][symbol] = {
                    'error': str(e)
                }
        
        # Get index data
        for index_name, index_symbol in self.indices.items():
            try:
                index_data = yf.download(index_symbol, period=period)
                if not index_data.empty:
                    market_data['indices'][index_name] = {
                        'current': float(index_data['Close'].iloc[-1]),
                        'change_1d': float(index_data['Close'].iloc[-1] - index_data['Close'].iloc[-2]) if len(index_data) > 1 else 0,
                        'change_percent_1d': float((index_data['Close'].iloc[-1] / index_data['Close'].iloc[-2] - 1) * 100) if len(index_data) > 1 else 0,
                    }
            except Exception as e:
                print(f"Error fetching data for index {index_name}: {str(e)}")
                market_data['indices'][index_name] = {'error': str(e)}
        
        # Calculate correlation matrix if we have more than one holding
        if len(symbols) > 1:
            returns_df = pd.DataFrame()
            for symbol in symbols:
                if symbol in market_data['holdings'] and 'history' in market_data['holdings'][symbol]:
                    history = market_data['holdings'][symbol]['history']
                    if history:
                        # Convert list of dicts to Series
                        close_prices = pd.Series([d['Close'] for d in history if 'Close' in d])
                        returns = close_prices.pct_change().dropna()
                        returns_df[symbol] = returns
            
            if not returns_df.empty:
                correlation_matrix = returns_df.corr().to_dict()
                market_data['correlation'] = correlation_matrix
        
        return market_data
    
    def get_macro_indicators(self):
        """
        Get macroeconomic indicators
        
        Returns:
            dict: Macroeconomic data
        """
        macro_data = {}
        
        # Get data for each macro indicator
        for indicator_name, indicator_symbol in self.macro_indicators.items():
            try:
                data = yf.download(indicator_symbol, period='1mo')
                if not data.empty:
                    macro_data[indicator_name] = {
                        'current': float(data['Close'].iloc[-1]),
                        'change_1d': float(data['Close'].iloc[-1] - data['Close'].iloc[-2]) if len(data) > 1 else 0,
                        'change_percent_1d': float((data['Close'].iloc[-1] / data['Close'].iloc[-2] - 1) * 100) if len(data) > 1 else 0,
                        'history': data['Close'].to_dict()
                    }
            except Exception as e:
                print(f"Error fetching macro data for {indicator_name}: {str(e)}")
                macro_data[indicator_name] = {'error': str(e)}
        
        return macro_data