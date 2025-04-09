import json
from services.broker_service import BrokerService
from services.market_service import MarketService
from services.news_service import NewsService
from services.sentiment_service import SentimentService
from services.prediction_service import PredictionService
from models.model_trainer import MarginOptimizerModelTrainer

def print_section(title):
    print("\n" + "="*50)
    print(f"  {title}")
    print("="*50)

def pretty_print(data):
    """Pretty print JSON data"""
    if isinstance(data, (dict, list)):
        print(json.dumps(data, indent=2, default=str))
    else:
        print(data)

def test_all_services():
    print_section("Testing All Services with Synthetic Data")
    
    # Initialize all services
    print("Initializing services...")
    broker = BrokerService()
    market = MarketService()
    news = NewsService()
    sentiment = SentimentService()
    prediction = PredictionService()
    
    # Test broker service
    print_section("Testing Broker Service")
    portfolio = broker.get_portfolio()
    print("Portfolio sample data:")
    pretty_print({
        "holdings_count": len(portfolio.get("holdings", [])),
        "positions_count": len(portfolio.get("positions", [])),
        "available_margin": portfolio.get("margin", {}).get("available_margin"),
        "used_margin": portfolio.get("margin", {}).get("used_margin")
    })
    
    # Test market service
    print_section("Testing Market Service")
    market_data = market.get_market_data(portfolio)
    print("Market data sample:")
    pretty_print({
        "indices_count": len(market_data.get("indices", {})),
        "sample_index": list(market_data.get("indices", {}).items())[0] if market_data.get("indices") else None,
        "volatility_count": len(market_data.get("volatility", {})),
        "sample_volatility": list(market_data.get("volatility", {}).items())[0] if market_data.get("volatility") else None
    })
    
    # Test news service
    print_section("Testing News Service")
    news_data = news.get_news_for_portfolio(portfolio)
    print("News data sample:")
    if isinstance(news_data, dict) and news_data.get("error"):
        print("Note: Running in demo mode due to missing API keys")
        pretty_print(news_data)
        # Create synthetic news data for testing
        news_data = [
            {
                "title": "Reliance Industries reports strong quarterly results", 
                "source": "Economic Times",
                "published_at": "2025-04-09T10:00:00Z", 
                "summary": "Reliance Industries reported strong quarterly results, exceeding analyst expectations. The company's revenue grew by 15% year-over-year."
            }
        ]
    else:
        pretty_print({
            "news_count": len(news_data),
            "sample_article": news_data[0] if news_data else None
        })
    
    # Test sentiment service
    print_section("Testing Sentiment Service")
    sample_article = {
        "title": "Reliance Industries reports strong quarterly results",
        "content": "Reliance Industries reported strong quarterly results, exceeding analyst expectations. The company's revenue grew by 15% year-over-year."
    }
    sentiment_result = sentiment.analyze_sentiment([sample_article])
    print("Sentiment analysis result:")
    pretty_print(sentiment_result)
    
    # Test prediction service
    print_section("Testing Prediction Service (Margin Optimization)")
    # Try the optimize method if it exists
    methods = [method for method in dir(prediction) if not method.startswith('_')]
    print(f"Available prediction methods: {methods}")
    
    if hasattr(prediction, 'predict_optimal_margin'):
        # Create sample sentiment data if we're using synthetic data
        if isinstance(news_data, list) and len(news_data) > 0:
            sentiment_data = sentiment.analyze_sentiment(news_data)
            if not sentiment_data or isinstance(sentiment_data, dict) and not sentiment_data:
                # Create synthetic sentiment data
                sentiment_data = {
                    "RELIANCE.NS": {"score": 0.75, "label": "positive"},
                    "HDFCBANK.NS": {"score": 0.65, "label": "positive"},
                    "TCS.NS": {"score": 0.45, "label": "neutral"}
                }
        else:
            sentiment_data = {}
            
        optimization = prediction.predict_optimal_margin(portfolio, market_data, sentiment_data)
        print("Margin optimization result:")
        pretty_print(optimization)
    else:
        print("No margin optimization method found in PredictionService")
    
    # Test model trainer
    print_section("Testing Model Trainer")
    trainer = MarginOptimizerModelTrainer()
    print("Generating synthetic training data...")
    trainer.generate_sample_training_data(10)
    print("Training model...")
    result = trainer.train_model()
    print("Model training result:")
    pretty_print(result)
    
    print_section("All Services Testing Complete")
    
if __name__ == "__main__":
    test_all_services()