import os
import pandas as pd
import numpy as np
import re
from datetime import datetime
import requests

# Check if we have the ANTHROPIC_API_KEY
anthropic_api_key = os.getenv('ANTHROPIC_API_KEY')

class SentimentService:
    def __init__(self):
        self.anthropic_api_key = os.getenv('ANTHROPIC_API_KEY')
        self.use_ai_sentiment = True if self.anthropic_api_key else False
        
        # Simple sentiment lexicon for rule-based sentiment analysis as fallback
        self.positive_words = [
            'bullish', 'uptrend', 'growth', 'profit', 'gain', 'positive', 'surge',
            'rally', 'outperform', 'beat', 'exceed', 'strong', 'robust', 'upgrade',
            'buy', 'opportunity', 'potential', 'upside', 'improve', 'succeed',
            'recovery', 'momentum', 'optimistic', 'confidence', 'progress'
        ]
        
        self.negative_words = [
            'bearish', 'downtrend', 'decline', 'loss', 'negative', 'fall', 'drop',
            'plunge', 'underperform', 'miss', 'weak', 'downgrade', 'sell', 'risk',
            'concern', 'downside', 'worsen', 'fail', 'pressure', 'pessimistic',
            'caution', 'trouble', 'recession', 'slowdown', 'debt', 'crisis'
        ]
    
    def analyze_sentiment(self, news_articles):
        """
        Analyze sentiment of news articles
        
        Args:
            news_articles (list): List of news articles
            
        Returns:
            dict: Sentiment analysis results by symbol
        """
        if not news_articles:
            return {"error": "No news articles provided"}
        
        # Group articles by related symbol
        articles_by_symbol = {}
        for article in news_articles:
            symbol = article.get('related_symbol')
            if symbol:
                if symbol not in articles_by_symbol:
                    articles_by_symbol[symbol] = []
                articles_by_symbol[symbol].append(article)
        
        # Analyze sentiment for each symbol
        sentiment_results = {}
        for symbol, articles in articles_by_symbol.items():
            if self.use_ai_sentiment:
                sentiment_scores = self._analyze_sentiment_with_ai(articles, symbol)
            else:
                sentiment_scores = self._analyze_sentiment_rule_based(articles, symbol)
            
            sentiment_results[symbol] = sentiment_scores
        
        # Calculate overall sentiment score
        if sentiment_results:
            overall_scores = []
            overall_confidence = []
            
            for symbol, result in sentiment_results.items():
                overall_scores.append(result['score'])
                overall_confidence.append(result['confidence'])
            
            overall_sentiment = {
                'score': float(np.mean(overall_scores)),
                'confidence': float(np.mean(overall_confidence))
            }
            
            sentiment_results['overall'] = overall_sentiment
        
        return sentiment_results
    
    def _analyze_sentiment_with_ai(self, articles, symbol):
        """Use Claude API for sentiment analysis"""
        
        try:
            # Prepare text for analysis
            combined_text = f"Financial news about {symbol}:\n\n"
            
            # Get the full text of articles if available, otherwise use description
            for article in articles[:5]:  # Limit to 5 articles to avoid token limits
                title = article.get('title', '')
                source = article.get('source', {}).get('name', 'Unknown source')
                text = article.get('full_text', article.get('description', ''))
                published = article.get('publishedAt', '')
                
                if published:
                    try:
                        published_date = datetime.fromisoformat(published.replace('Z', '+00:00'))
                        published = published_date.strftime('%Y-%m-%d')
                    except:
                        pass
                
                combined_text += f"Title: {title}\n"
                combined_text += f"Source: {source}\n"
                combined_text += f"Date: {published}\n"
                combined_text += f"Content: {text}\n\n"
            
            # Prepare the prompt for Claude
            prompt = f"""
            I'll give you financial news about {symbol}. Analyze the sentiment from a trader's perspective.
            Focus on how this news might impact:
            1. Stock price in short-term (1-5 days)
            2. Market sentiment toward this company
            3. Potential risks or opportunities
            
            Rate the overall sentiment on a scale of -1.0 (extremely negative) to 1.0 (extremely positive), 
            with 0 being neutral. Also provide a confidence level from 0.0 to 1.0.
            
            Return ONLY a JSON object with these fields:
            - score: The sentiment score (-1.0 to 1.0)
            - confidence: Your confidence level (0.0 to 1.0)
            
            Here's the news to analyze:
            {combined_text}
            """
            
            # Call Anthropic API
            response = requests.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "Content-Type": "application/json",
                    "x-api-key": self.anthropic_api_key,
                    "anthropic-version": "2023-06-01"
                },
                json={
                    "model": "claude-3-sonnet-20240229",
                    "max_tokens": 200,
                    "messages": [{"role": "user", "content": prompt}]
                }
            )
            
            result = response.json()
            
            if 'content' in result and len(result['content']) > 0:
                content = result['content'][0]['text']
                
                # Extract JSON from the response
                json_pattern = r'\{.*?\}'
                json_match = re.search(json_pattern, content, re.DOTALL)
                
                if json_match:
                    import json
                    sentiment_data = json.loads(json_match.group(0))
                    
                    # Validate and sanitize results
                    score = sentiment_data.get('score', 0)
                    score = max(-1.0, min(1.0, float(score)))
                    
                    confidence = sentiment_data.get('confidence', 0.5)
                    confidence = max(0.0, min(1.0, float(confidence)))
                    
                    return {
                        'score': score,
                        'confidence': confidence,
                        'method': 'ai'
                    }
            
            # Fallback to rule-based if AI parsing fails
            return self._analyze_sentiment_rule_based(articles, symbol)
            
        except Exception as e:
            print(f"Error in AI sentiment analysis: {str(e)}")
            # Fallback to rule-based sentiment analysis
            return self._analyze_sentiment_rule_based(articles, symbol)
    
    def _analyze_sentiment_rule_based(self, articles, symbol):
        """Simple rule-based sentiment analysis"""
        try:
            scores = []
            
            for article in articles:
                # Get text content
                title = article.get('title', '').lower()
                description = article.get('description', '').lower()
                content = article.get('full_text', '').lower()
                
                combined_text = f"{title} {description} {content}"
                
                # Count positive and negative words
                positive_count = sum(1 for word in self.positive_words if word in combined_text)
                negative_count = sum(1 for word in self.negative_words if word in combined_text)
                
                # Calculate simple sentiment score
                total_count = positive_count + negative_count
                if total_count > 0:
                    article_score = (positive_count - negative_count) / total_count
                else:
                    article_score = 0
                
                scores.append(article_score)
            
            # Calculate average sentiment score
            if scores:
                avg_score = np.mean(scores)
                
                # Simple confidence based on number of articles and consistency of scores
                articles_confidence = min(1.0, len(articles) / 10)  # More articles = higher confidence
                std_confidence = 1.0 - min(1.0, np.std(scores) * 2)  # Lower standard deviation = higher confidence
                
                confidence = (articles_confidence + std_confidence) / 2
                
                return {
                    'score': float(avg_score),
                    'confidence': float(confidence),
                    'method': 'rule-based'
                }
            else:
                return {
                    'score': 0.0,
                    'confidence': 0.0,
                    'method': 'rule-based'
                }
                
        except Exception as e:
            print(f"Error in rule-based sentiment analysis: {str(e)}")
            return {
                'score': 0.0,
                'confidence': 0.0,
                'method': 'rule-based',
                'error': str(e)
            }