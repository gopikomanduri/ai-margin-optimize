import os
from flask import Flask, jsonify, request, render_template
from flask_cors import CORS
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import services
from services.news_service import NewsService
from services.market_service import MarketService
from services.broker_service import BrokerService
from services.sentiment_service import SentimentService
from services.prediction_service import PredictionService

# Create Flask app
app = Flask(__name__, 
            static_folder='static',
            template_folder='templates')

# Enable CORS
CORS(app)

# Initialize services
news_service = NewsService()
market_service = MarketService()
broker_service = BrokerService()
sentiment_service = SentimentService()
prediction_service = PredictionService()

# Routes
@app.route('/')
def index():
    """Render the main dashboard page"""
    return render_template('index.html')

@app.route('/api/portfolio', methods=['GET'])
def get_portfolio():
    """Get user's portfolio from broker API"""
    try:
        # In production, this would be authenticated
        portfolio = broker_service.get_portfolio()
        return jsonify(portfolio)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/news', methods=['GET'])
def get_news():
    """Get relevant financial news based on user portfolio"""
    try:
        # Get news related to user portfolio
        portfolio = broker_service.get_portfolio()
        news = news_service.get_news_for_portfolio(portfolio)
        return jsonify(news)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/sentiment', methods=['GET'])
def get_sentiment():
    """Get sentiment analysis for portfolio holdings"""
    try:
        # Get news and analyze sentiment
        portfolio = broker_service.get_portfolio()
        news = news_service.get_news_for_portfolio(portfolio)
        sentiment = sentiment_service.analyze_sentiment(news)
        return jsonify(sentiment)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/margin/optimize', methods=['GET'])
def optimize_margin():
    """Get optimized margin requirements"""
    try:
        # Get all necessary data
        portfolio = broker_service.get_portfolio()
        news = news_service.get_news_for_portfolio(portfolio)
        market_data = market_service.get_market_data(portfolio)
        sentiment = sentiment_service.analyze_sentiment(news)
        
        # Make prediction
        optimized_margin = prediction_service.predict_optimal_margin(
            portfolio, market_data, sentiment
        )
        
        return jsonify(optimized_margin)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/macro', methods=['GET'])
def get_macro():
    """Get macroeconomic indicators"""
    try:
        macro_data = market_service.get_macro_indicators()
        return jsonify(macro_data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/broker/connect', methods=['POST'])
def connect_broker():
    """Connect to broker API"""
    try:
        data = request.json
        result = broker_service.connect(data.get('broker'), data.get('credentials'))
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Run the app on 0.0.0.0 to make it externally accessible
    app.run(host='0.0.0.0', port=5000, debug=True)