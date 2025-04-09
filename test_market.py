from services.market_service import MarketService
from services.broker_service import BrokerService

def test_market_service():
    try:
        # Initialize services
        market = MarketService()
        broker = BrokerService()
        
        # Get portfolio data
        portfolio = broker.get_portfolio()
        
        # Test market data retrieval
        try:
            market_data = market.get_market_data(portfolio)
            print('Market data retrieved successfully:')
            print(f'Number of holdings with data: {len(market_data.get("holdings", {}).keys())}')
            print(f'Number of indices: {len(market_data.get("indices", {}).keys())}')
            
            # Show some sample data
            if market_data.get("indices", {}):
                print('\nSample index data:')
                for index_name, index_data in list(market_data.get("indices", {}).items())[:2]:
                    print(f' - {index_name}: {index_data.get("current", "N/A")}')
            
            if market_data.get("volatility", {}):
                print('\nSample volatility data:')
                for symbol, vol in list(market_data.get("volatility", {}).items())[:2]:
                    print(f' - {symbol}: {vol}')
        except Exception as e:
            print(f'Error retrieving market data: {str(e)}')
        
        # Test macro indicators retrieval
        try:
            macro_data = market.get_macro_indicators()
            print('\nMacro indicators retrieved successfully:')
            print(f'Number of indicators: {len(macro_data.keys())}')
            
            # Show some sample data
            print('Sample indicators:')
            for key in list(macro_data.keys())[:3]:
                print(f' - {key}: {macro_data[key].get("current", "N/A")}')
        except Exception as e:
            print(f'Error retrieving macro indicators: {str(e)}')
            
    except Exception as e:
        print(f'Test failed: {str(e)}')

if __name__ == "__main__":
    test_market_service()