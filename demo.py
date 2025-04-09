from flask import Flask, render_template, jsonify, request
from services.broker_service import BrokerService
from services.market_service import MarketService
from services.news_service import NewsService
from services.sentiment_service import SentimentService
from services.prediction_service import PredictionService
import os
import json
import datetime

app = Flask(__name__, static_folder="static", template_folder="templates")

# Initialize services
broker = BrokerService()
market = MarketService()
news = NewsService()
sentiment = SentimentService()
prediction = PredictionService()

@app.route('/')
def index():
    """Render the main dashboard page"""
    return render_template('demo.html')

@app.route('/api/portfolio')
def get_portfolio():
    """Get user's portfolio for demo"""
    portfolio = broker.get_portfolio()
    return jsonify(portfolio)

@app.route('/api/market')
def get_market():
    """Get market data for demo"""
    portfolio = broker.get_portfolio()
    market_data = market.get_market_data(portfolio)
    return jsonify(market_data)

@app.route('/api/news')
def get_news():
    """Get news data for demo"""
    portfolio = broker.get_portfolio()
    news_data = news.get_news_for_portfolio(portfolio)
    
    # If we got an error, use demo news
    if isinstance(news_data, dict) and news_data.get("error"):
        news_data = [
            {
                "title": "Reliance Industries reports strong quarterly results", 
                "source": "Economic Times",
                "published_at": "2025-04-09T10:00:00Z", 
                "summary": "Reliance Industries reported strong quarterly results, exceeding analyst expectations. The company's revenue grew by 15% year-over-year."
            },
            {
                "title": "HDFC Bank announces new digital initiatives", 
                "source": "Financial Express",
                "published_at": "2025-04-08T09:15:00Z", 
                "summary": "HDFC Bank unveiled several new digital initiatives aimed at enhancing customer experience and streamlining operations."
            },
            {
                "title": "TCS wins major contract with European client", 
                "source": "Business Standard",
                "published_at": "2025-04-07T14:30:00Z", 
                "summary": "Tata Consultancy Services has secured a significant multi-year contract with a leading European financial institution."
            }
        ]
    
    return jsonify(news_data)

@app.route('/api/sentiment')
def get_sentiment():
    """Get sentiment analysis for demo"""
    portfolio = broker.get_portfolio()
    news_data = news.get_news_for_portfolio(portfolio)
    
    # If we got an error, use demo news
    if isinstance(news_data, dict) and news_data.get("error"):
        sentiment_data = {
            "RELIANCE.NS": {"score": 0.75, "label": "positive"},
            "HDFCBANK.NS": {"score": 0.65, "label": "positive"},
            "TCS.NS": {"score": 0.45, "label": "neutral"},
            "INFY.NS": {"score": 0.60, "label": "positive"},
            "ICICIBANK.NS": {"score": 0.55, "label": "positive"}
        }
    else:
        sentiment_data = sentiment.analyze_sentiment(news_data)
    
    return jsonify(sentiment_data)

@app.route('/api/optimize', methods=['POST'])
def optimize_margin():
    """Get optimized margin requirements"""
    data = request.json
    manual_factors = data.get('factors', {})
    
    portfolio = broker.get_portfolio()
    market_data = market.get_market_data(portfolio)
    sentiment_data = json.loads(get_sentiment().data)
    
    # Run prediction with current data
    result = prediction.predict_optimal_margin(portfolio, market_data, sentiment_data)
    
    # Add timestamp for demo purposes
    result['timestamp'] = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    
    return jsonify(result)

@app.route('/api/factors')
def get_factors():
    """Get optimization factors for demo"""
    return jsonify({
        "market_volatility": 0.65,
        "sentiment_score": 0.70,
        "liquidity_index": 0.80,
        "correlation_factor": 0.55,
        "macro_impact": 0.60
    })

if __name__ == '__main__':
    # Create necessary directories if they don't exist
    os.makedirs('templates', exist_ok=True)
    os.makedirs('static/js', exist_ok=True)
    os.makedirs('static/css', exist_ok=True)
    
    # Run the app
    app.run(host='0.0.0.0', port=8080, debug=True)