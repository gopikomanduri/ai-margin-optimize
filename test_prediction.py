from services.prediction_service import PredictionService
from services.broker_service import BrokerService
from services.market_service import MarketService
from services.news_service import NewsService

def test_prediction_service():
    try:
        # Initialize services
        prediction = PredictionService()
        broker = BrokerService()
        market = MarketService()
        news = NewsService()
        
        # Get portfolio data
        portfolio = broker.get_portfolio()
        
        # Get market data
        market_data = market.get_market_data(portfolio)
        
        # Get news data
        news_data = news.get_news_for_portfolio(portfolio)
        
        # Test margin optimization
        try:
            optimization_result = prediction.optimize_margin(portfolio, market_data, news_data)
            print('Margin optimization successful:')
            print(f'Original margin: {optimization_result.get("original_margin", "N/A")}')
            print(f'Optimized margin: {optimization_result.get("optimized_margin", "N/A")}')
            print(f'Reduction: {optimization_result.get("reduction_percent", "N/A")}%')
            
            # Show optimization factors
            if optimization_result.get("factors", {}):
                print('\nOptimization factors:')
                for factor, value in optimization_result.get("factors", {}).items():
                    print(f' - {factor}: {value}')
                    
            # Show optimized positions
            if optimization_result.get("positions", []):
                print('\nSample optimized positions:')
                for position in optimization_result.get("positions", [])[:2]:
                    print(f' - {position.get("symbol", "N/A")}: Original margin: {position.get("original_margin", "N/A")}, Optimized: {position.get("optimized_margin", "N/A")}')
        except Exception as e:
            print(f'Error in margin optimization: {str(e)}')
            
    except Exception as e:
        print(f'Test failed: {str(e)}')

if __name__ == "__main__":
    test_prediction_service()