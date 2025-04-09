from services.broker_service import BrokerService
from services.market_service import MarketService
from services.prediction_service import PredictionService

def test_simple_prediction():
    # Initialize services
    broker = BrokerService()
    market = MarketService()
    prediction = PredictionService()
    
    # Get data
    portfolio = broker.get_portfolio()
    market_data = market.get_market_data(portfolio)
    
    # Create synthetic sentiment data
    sentiment_data = {
        'RELIANCE.NS': {'score': 0.75, 'label': 'positive'}, 
        'HDFCBANK.NS': {'score': 0.65, 'label': 'positive'}
    }
    
    # Test margin optimization
    if hasattr(prediction, 'predict_optimal_margin'):
        result = prediction.predict_optimal_margin(portfolio, market_data, sentiment_data)
        print('Optimization successful:')
        print(f'Current margin: {result.get("current_margin")}')
        print(f'Optimized margin: {result.get("optimized_margin")}')
        print(f'Reduction: {result.get("reduction_percent")}%')
        print(f'Confidence: {result.get("confidence")}')
        return True
    else:
        print('Method not found')
        return False

if __name__ == "__main__":
    test_simple_prediction()