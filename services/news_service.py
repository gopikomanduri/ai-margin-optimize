import os
import requests
from newsapi import NewsApiClient
import tweepy
from newspaper import Article
import pandas as pd

class NewsService:
    def __init__(self):
        # Initialize NewsAPI client
        self.news_api_key = os.getenv('NEWS_API_KEY')
        self.newsapi = None
        if self.news_api_key:
            self.newsapi = NewsApiClient(api_key=self.news_api_key)
        
        # Initialize Twitter API client
        self.twitter_api_key = os.getenv('TWITTER_API_KEY')
        self.twitter_api_secret = os.getenv('TWITTER_API_SECRET')
        self.twitter_access_token = os.getenv('TWITTER_ACCESS_TOKEN')
        self.twitter_access_secret = os.getenv('TWITTER_ACCESS_SECRET')
        self.twitter_api = None
        
        if all([self.twitter_api_key, self.twitter_api_secret, 
                self.twitter_access_token, self.twitter_access_secret]):
            auth = tweepy.OAuth1UserHandler(
                self.twitter_api_key, self.twitter_api_secret,
                self.twitter_access_token, self.twitter_access_secret
            )
            self.twitter_api = tweepy.API(auth)
    
    def get_news_for_portfolio(self, portfolio):
        """
        Get news related to a portfolio's holdings
        
        Args:
            portfolio (dict): Portfolio with holdings
            
        Returns:
            list: News articles related to portfolio holdings
        """
        news = []
        
        # Check if NewsAPI is configured
        if not self.newsapi:
            return {"error": "NewsAPI key not configured"}
        
        # Extract tickers/company names from portfolio
        symbols = []
        for holding in portfolio.get('holdings', []):
            symbols.append(holding.get('symbol'))
        
        # Get news for each symbol
        for symbol in symbols:
            try:
                # Get news from NewsAPI
                articles = self.newsapi.get_everything(
                    q=symbol,
                    language='en',
                    sort_by='relevancy',
                    page_size=5
                )
                
                for article in articles.get('articles', []):
                    # Extract full text if available
                    try:
                        article_url = article.get('url')
                        if article_url:
                            article_obj = Article(article_url)
                            article_obj.download()
                            article_obj.parse()
                            article['full_text'] = article_obj.text
                    except Exception as e:
                        article['full_text'] = article.get('description', '')
                    
                    # Add symbol to track which holding this relates to
                    article['related_symbol'] = symbol
                    news.append(article)
                    
            except Exception as e:
                print(f"Error fetching news for {symbol}: {str(e)}")
        
        # Get Twitter data if configured
        if self.twitter_api:
            for symbol in symbols:
                try:
                    tweets = self.twitter_api.search_tweets(q=symbol, count=10)
                    for tweet in tweets:
                        news.append({
                            'source': 'Twitter',
                            'author': tweet.user.screen_name,
                            'title': '',
                            'description': tweet.text,
                            'url': f"https://twitter.com/{tweet.user.screen_name}/status/{tweet.id}",
                            'publishedAt': tweet.created_at.isoformat(),
                            'related_symbol': symbol,
                            'full_text': tweet.text
                        })
                except Exception as e:
                    print(f"Error fetching tweets for {symbol}: {str(e)}")
        
        return news