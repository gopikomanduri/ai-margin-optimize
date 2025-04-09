# AI Margin Optimizer for F&O Large Traders

An AI-powered system that helps high-net-worth individuals reduce collateral over-pledging by 20-30% through advanced analysis of news sentiment, market data, and portfolio composition.

## Features

- **News Sentiment Analyzer**: Analyzes financial news from NewsAPI.org and Twitter to understand market sentiment
- **Macro Impact Engine**: Considers macroeconomic indicators from forex and commodity markets
- **Ensemble Predictor**: Uses XGBoost + LSTM to predict optimal margin requirements based on NSE historical data
- **Portfolio Integration**: Connects with broker APIs (ICICI/Kotak) to fetch real portfolio data
- **Margin Optimization**: Provides actionable insights to reduce margin requirements by 20-30%

## Technology Stack

- **Backend**: Python, Flask, XGBoost, HuggingFace Transformers
- **Data Sources**: NewsAPI.org, Twitter API, yfinance, Broker APIs (ICICI/Kotak)
- **Frontend**: HTML, CSS, JavaScript, Bootstrap 5, Chart.js

## Getting Started

### Prerequisites

- Python 3.10 or higher
- Required Python packages (install with `pip install -r requirements.txt`)
- API keys for:
  - NewsAPI.org
  - Twitter API
  - Broker APIs (ICICI/Kotak) - optional, will run in demo mode without them
  - Anthropic API (for advanced sentiment analysis) - optional, will use rule-based analysis without it

### Installation

1. Clone the repository
2. Create a `.env` file with your API keys:
   ```
   NEWS_API_KEY=your_news_api_key
   TWITTER_API_KEY=your_twitter_api_key
   TWITTER_API_SECRET=your_twitter_api_secret
   TWITTER_ACCESS_TOKEN=your_twitter_access_token
   TWITTER_ACCESS_SECRET=your_twitter_access_secret
   ICICI_API_KEY=your_icici_api_key
   ICICI_API_SECRET=your_icici_api_secret
   KOTAK_API_KEY=your_kotak_api_key
   KOTAK_API_SECRET=your_kotak_api_secret
   ANTHROPIC_API_KEY=your_anthropic_api_key
   ```
3. Run the setup script to initialize the project:
   ```
   python setup.py
   ```
4. Start the application:
   ```
   python app.py
   ```
5. Open your browser and navigate to `http://localhost:5000`

## Project Structure

- `/api`: API endpoints and route handlers
- `/models`: Machine learning models for margin optimization
- `/services`: Service layer for news, market data, sentiment analysis, etc.
- `/static`: Static assets (CSS, JavaScript, images)
- `/templates`: HTML templates
- `/utils`: Utility functions
- `app.py`: Main application entry point
- `setup.py`: Setup script

## Usage Flow

1. Connect your broker account (or use demo mode)
2. The system fetches your portfolio data including F&O positions
3. News and sentiment are analyzed for each position
4. Market conditions are assessed through macro indicators
5. The AI model predicts optimal margin requirements
6. Recommendations are provided for potential savings

## Business Impact

- Reduce collateral over-pledging by 20-30% for HNIs
- Integrate real-time news/sentiment into margin calculations
- Achieve ₹3Cr ARR within 12 months

## Security & Compliance

- Data Privacy: AES-256 encryption for portfolio data
- Regulatory: Read-only access to broker systems (no SEBI approval required)

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.