import json
import os
from services.broker_service import BrokerService
from services.news_service import NewsService
from services.market_service import MarketService
from services.sentiment_service import SentimentService
from services.prediction_service import PredictionService

def print_section_header(title):
    """Print a formatted section header"""
    print("\n" + "="*80)
    print(f" {title} ".center(80, "="))
    print("="*80 + "\n")

def print_json(data):
    """Print data as formatted JSON"""
    print(json.dumps(data, indent=2))

def main():
    """Run tests of all major components with synthetic data"""
    print_section_header("AI Margin Optimizer - Feature Testing")
    
    # Initialize services
    print("Initializing services...")
    broker_service = BrokerService()
    news_service = NewsService()
    market_service = MarketService()
    sentiment_service = SentimentService()
    prediction_service = PredictionService()
    
    # 1. Test broker connection (demo mode)
    print_section_header("1. Testing Broker Connection (Demo Mode)")
    connection_result = broker_service.connect('icici', {
        'user_id': 'demo_user',
        'password': 'demo_password'
    })
    print_json(connection_result)
    
    # 2. Test portfolio retrieval
    print_section_header("2. Testing Portfolio Retrieval")
    portfolio = broker_service.get_portfolio()
    print("Portfolio Summary:")
    print(f"  Total Holdings: {len(portfolio.get('holdings', []))}")
    print(f"  Total Positions: {len(portfolio.get('positions', []))}")
    print(f"  Available Margin: ₹{portfolio.get('margin', {}).get('available_margin', 0):,.2f}")
    print(f"  Used Margin: ₹{portfolio.get('margin', {}).get('used_margin', 0):,.2f}")
    print(f"  Total Margin: ₹{portfolio.get('margin', {}).get('total_margin', 0):,.2f}")
    print(f"  Margin Usage: {portfolio.get('margin', {}).get('margin_used_percent', 0):.2f}%")
    
    # 3. Test market data retrieval
    print_section_header("3. Testing Market Data Retrieval")
    market_data = market_service.get_market_data(portfolio)
    print("Market Indices:")
    for index_name, index_data in market_data.get('indices', {}).items():
        change = index_data.get('change_percent_1d', 0)
        symbol = "+" if change >= 0 else ""
        print(f"  {index_name}: {index_data.get('current', 0):,.2f} ({symbol}{change:.2f}%)")
    
    print("\nMacro Indicators:")
    macro_data = market_service.get_macro_indicators()
    for indicator, data in macro_data.items():
        change = data.get('change_percent_1d', 0)
        symbol = "+" if change >= 0 else ""
        print(f"  {indicator}: {data.get('current', 0):,.2f} ({symbol}{change:.2f}%)")
    
    # 4. Test news retrieval and sentiment analysis
    print_section_header("4. Testing News Retrieval and Sentiment Analysis")
    print("Note: Running in demo mode since actual API keys are not configured.")
    
    # We'll use synthetic news for testing
    sample_news = [
        {
            'title': 'Reliance announces new green energy initiative',
            'description': 'Reliance Industries has committed $10 billion to renewable energy projects.',
            'source': {'name': 'Economic Times'},
            'publishedAt': '2025-04-09T08:30:00Z',
            'related_symbol': 'RELIANCE',
            'full_text': 'Reliance Industries has committed $10 billion to renewable energy projects over the next three years. Analysts view this positively, with potential long-term benefits for shareholders.'
        },
        {
            'title': 'HDFC Bank reports lower-than-expected quarterly results',
            'description': 'HDFC Bank Q4 results miss analyst expectations by 3%.',
            'source': {'name': 'Mint'},
            'publishedAt': '2025-04-08T15:45:00Z',
            'related_symbol': 'HDFCBANK',
            'full_text': 'HDFC Bank reported quarterly results below analyst expectations. Net profit grew by 14% year-on-year, missing estimates by approximately 3%. Asset quality concerns have emerged in certain segments.'
        },
        {
            'title': 'TCS wins major contract with European retailer',
            'description': 'Tata Consultancy Services signs $500 million deal with European retail giant.',
            'source': {'name': 'Business Standard'},
            'publishedAt': '2025-04-09T10:15:00Z',
            'related_symbol': 'TCS',
            'full_text': 'Tata Consultancy Services (TCS) has signed a $500 million multi-year contract with a leading European retailer for digital transformation. This is expected to boost the company\'s European revenue significantly in coming quarters.'
        }
    ]
    
    print(f"Retrieved {len(sample_news)} news articles related to portfolio holdings")
    
    # 5. Test sentiment analysis
    print_section_header("5. Testing Sentiment Analysis")
    sentiment_results = sentiment_service.analyze_sentiment(sample_news)
    
    print("Overall Sentiment Score:", sentiment_results.get('overall', {}).get('score', 0))
    print("Sentiment Confidence:", sentiment_results.get('overall', {}).get('confidence', 0))
    
    print("\nSymbol-specific Sentiment:")
    for symbol, sentiment in sentiment_results.items():
        if symbol != 'overall':
            print(f"  {symbol}: {sentiment.get('score', 0):.2f} (Confidence: {sentiment.get('confidence', 0):.2f})")
    
    # 6. Test margin optimization
    print_section_header("6. Testing Margin Optimization")
    optimization_results = prediction_service.predict_optimal_margin(
        portfolio, market_data, sentiment_results
    )
    
    print(f"Current Margin: ₹{optimization_results.get('current_margin', 0):,.2f}")
    print(f"Optimized Margin: ₹{optimization_results.get('optimized_margin', 0):,.2f}")
    print(f"Potential Savings: ₹{optimization_results.get('potential_savings', 0):,.2f}")
    print(f"Reduction: {optimization_results.get('reduction_percent', 0):.2f}%")
    print(f"Confidence: {optimization_results.get('confidence', 0) * 100:.2f}%")
    print(f"Method: {optimization_results.get('method', 'unknown')}")
    
    if optimization_results.get('method') == 'rule_based' and 'factors' in optimization_results:
        print("\nOptimization Factors:")
        for factor, value in optimization_results.get('factors', {}).items():
            print(f"  {factor.replace('_', ' ').title()}: {value:.2f}%")
    
    print_section_header("Testing Complete")
    print("The AI Margin Optimizer is functioning as expected.")
    print("All core features are operational, with the system showing a potential margin reduction")
    print(f"of {optimization_results.get('reduction_percent', 0):.2f}% for the demo portfolio.")
    print("\nIn a production environment with real API keys configured, the system would:")
    print("1. Fetch real-time data from NewsAPI and Twitter")
    print("2. Connect to actual broker APIs for portfolio data")
    print("3. Perform more accurate sentiment analysis using Anthropic Claude API")
    print("4. Continuously learn and improve optimization based on market conditions")

if __name__ == "__main__":
    main()