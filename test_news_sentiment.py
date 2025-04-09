from services.news_service import NewsService
from services.sentiment_service import SentimentService
from services.broker_service import BrokerService

def test_news_and_sentiment():
    try:
        # Initialize services
        news = NewsService()
        sentiment = SentimentService()
        broker = BrokerService()
        
        # Get portfolio for stock symbols
        portfolio = broker.get_portfolio()
        
        # Test news retrieval
        try:
            news_data = news.get_news_for_portfolio(portfolio)
            print('News retrieved successfully:')
            print(f'Number of news articles: {len(news_data)}')
            
            # Show a sample news article
            if news_data:
                print('\nSample news article:')
                article = news_data[0]
                print(f'Title: {article.get("title", "N/A")}')
                print(f'Source: {article.get("source", "N/A")}')
                print(f'Date: {article.get("published_at", "N/A")}')
                print(f'Summary: {article.get("summary", "N/A")[:100]}...')
        except Exception as e:
            print(f'Error retrieving news: {str(e)}')
        
        # Test sentiment analysis with sample text
        try:
            # Create a sample news article
            sample_article = {
                "title": "Reliance Industries reports strong quarterly results",
                "content": "Reliance Industries reported strong quarterly results, exceeding analyst expectations. The company's revenue grew by 15% year-over-year."
            }
            
            # Get sentiment
            sentiment_result = sentiment.analyze_sentiment([sample_article])
            print('\nSentiment analysis successful:')
            print(f'Result: {sentiment_result}')
            
            # Now try with actual news data if available
            if news_data:
                news_sentiment = sentiment.analyze_sentiment(news_data[:2])  # Test with first 2 news articles
                print('\nNews sentiment analysis:')
                print(f'Result: {news_sentiment}')
        except Exception as e:
            print(f'Error in sentiment analysis: {str(e)}')
            
    except Exception as e:
        print(f'Test failed: {str(e)}')

if __name__ == "__main__":
    test_news_and_sentiment()