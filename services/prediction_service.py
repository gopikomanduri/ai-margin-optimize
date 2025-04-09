import os
import pandas as pd
import numpy as np
import xgboost as xgb
from datetime import datetime, timedelta
import json
import pickle
import os.path

class PredictionService:
    def __init__(self):
        self.model_path = 'models/margin_optimizer_model.pkl'
        self.model = None
        self.feature_columns = None
        
        # Load model if exists
        self._load_model()
    
    def _load_model(self):
        """Load the model if it exists"""
        if os.path.exists(self.model_path):
            try:
                with open(self.model_path, 'rb') as f:
                    model_data = pickle.load(f)
                    self.model = model_data.get('model')
                    self.feature_columns = model_data.get('feature_columns')
                print(f"Model loaded from {self.model_path}")
            except Exception as e:
                print(f"Error loading model: {str(e)}")
                self.model = None
        else:
            print(f"Model file not found at {self.model_path}")
            self.model = None
    
    def _save_model(self):
        """Save the model to disk"""
        if self.model and self.feature_columns:
            try:
                os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
                with open(self.model_path, 'wb') as f:
                    model_data = {
                        'model': self.model,
                        'feature_columns': self.feature_columns
                    }
                    pickle.dump(model_data, f)
                print(f"Model saved to {self.model_path}")
            except Exception as e:
                print(f"Error saving model: {str(e)}")
    
    def predict_optimal_margin(self, portfolio, market_data, sentiment_data):
        """
        Predict optimal margin requirements based on market data and sentiment
        
        Args:
            portfolio (dict): Portfolio data
            market_data (dict): Market data
            sentiment_data (dict): Sentiment analysis results
            
        Returns:
            dict: Optimized margin recommendations
        """
        # Extract relevant data and prepare features
        features = self._prepare_features(portfolio, market_data, sentiment_data)
        
        # Check if we have a trained model
        if self.model is None:
            # No trained model, use rule-based approach
            return self._rule_based_optimization(portfolio, market_data, sentiment_data, features)
        
        # Make prediction with model
        try:
            # Ensure features are in correct format and order
            df = pd.DataFrame([features])
            
            # Only include columns the model was trained on
            if self.feature_columns:
                for col in self.feature_columns:
                    if col not in df.columns:
                        df[col] = 0  # Default value if feature is missing
                df = df[self.feature_columns]
            
            # Make prediction
            predicted_margin_reduction = self.model.predict(df)[0]
            
            # Calculate optimized margin
            current_margin = portfolio.get('margin', {}).get('used_margin', 0)
            optimized_margin = current_margin * (1 - predicted_margin_reduction)
            
            # Calculate potential savings
            savings = current_margin - optimized_margin
            
            return {
                'current_margin': current_margin,
                'optimized_margin': float(optimized_margin),
                'reduction_percent': float(predicted_margin_reduction * 100),
                'potential_savings': float(savings),
                'method': 'ml_model',
                'features_used': list(features.keys()),
                'confidence': 0.85  # Model confidence score
            }
            
        except Exception as e:
            print(f"Error in model prediction: {str(e)}")
            # Fallback to rule-based approach
            return self._rule_based_optimization(portfolio, market_data, sentiment_data, features)
    
    def _prepare_features(self, portfolio, market_data, sentiment_data):
        """Prepare features for model prediction"""
        features = {}
        
        # Portfolio features
        positions_count = len(portfolio.get('positions', []))
        holdings_count = len(portfolio.get('holdings', []))
        total_positions_value = sum(
            pos.get('qty', 0) * pos.get('current_price', 0) 
            for pos in portfolio.get('positions', [])
        )
        
        features['positions_count'] = positions_count
        features['holdings_count'] = holdings_count
        features['positions_to_holdings_ratio'] = positions_count / max(1, holdings_count)
        
        # Market features
        # 1. Volatility features
        avg_volatility = np.mean(list(market_data.get('volatility', {}).values())) if market_data.get('volatility') else 0
        features['avg_volatility'] = avg_volatility
        
        # 2. Index features
        for index_name, index_data in market_data.get('indices', {}).items():
            features[f'{index_name.lower()}_change_pct'] = index_data.get('change_percent_1d', 0)
        
        # 3. Correlation features
        if 'correlation' in market_data and market_data['correlation']:
            # Average correlation between portfolio holdings
            corr_values = []
            corr_data = market_data['correlation']
            
            for symbol1 in corr_data:
                for symbol2 in corr_data[symbol1]:
                    if symbol1 != symbol2:
                        corr_values.append(corr_data[symbol1][symbol2])
            
            avg_correlation = np.mean(corr_values) if corr_values else 0
            features['avg_correlation'] = avg_correlation
        
        # Sentiment features
        overall_sentiment = sentiment_data.get('overall', {})
        features['overall_sentiment_score'] = overall_sentiment.get('score', 0)
        features['overall_sentiment_confidence'] = overall_sentiment.get('confidence', 0)
        
        # Get average sentiment for positions
        position_symbols = [
            pos.get('symbol').split()[0]  # Extract base symbol from position (e.g., "NIFTY" from "NIFTY APR FUT")
            for pos in portfolio.get('positions', [])
        ]
        
        position_sentiment_scores = []
        for symbol in position_symbols:
            # Try to find sentiment for this position
            if symbol in sentiment_data:
                position_sentiment_scores.append(sentiment_data[symbol].get('score', 0))
        
        features['avg_position_sentiment'] = np.mean(position_sentiment_scores) if position_sentiment_scores else 0
        
        # Other features
        current_margin = portfolio.get('margin', {}).get('used_margin', 0)
        features['current_margin'] = current_margin
        features['margin_per_position'] = current_margin / max(1, positions_count)
        
        # Risk features
        # Positions with negative PnL
        negative_positions = [
            pos for pos in portfolio.get('positions', [])
            if pos.get('pnl', 0) < 0
        ]
        features['negative_positions_ratio'] = len(negative_positions) / max(1, positions_count)
        
        return features
    
    def _rule_based_optimization(self, portfolio, market_data, sentiment_data, features=None):
        """
        Rule-based approach to optimize margin when no ML model is available
        
        This uses a set of heuristics to provide a reasonable optimization
        """
        if features is None:
            features = self._prepare_features(portfolio, market_data, sentiment_data)
        
        # Get current portfolio data
        current_margin = portfolio.get('margin', {}).get('used_margin', 0)
        
        # Base reduction ratio (conservative default)
        base_reduction = 0.05  # 5% base reduction
        
        # Adjust based on market volatility
        avg_volatility = features.get('avg_volatility', 0)
        volatility_factor = max(0, 0.10 - avg_volatility)  # Lower volatility allows more reduction
        
        # Adjust based on index movements
        index_change = features.get('nifty_change_pct', 0)
        index_factor = 0.02 if index_change > 0 else -0.02  # Positive market = more reduction
        
        # Adjust based on sentiment
        sentiment_score = features.get('overall_sentiment_score', 0)
        sentiment_confidence = features.get('overall_sentiment_confidence', 0)
        sentiment_factor = sentiment_score * sentiment_confidence * 0.05  # Max ±5% based on sentiment
        
        # Adjust based on correlation
        correlation_factor = (1 - features.get('avg_correlation', 0.5)) * 0.04  # Lower correlation = more reduction
        
        # Calculate final reduction percentage
        reduction_percentage = base_reduction + volatility_factor + index_factor + sentiment_factor + correlation_factor
        
        # Ensure it's within reasonable bounds (5-25%)
        reduction_percentage = max(0.05, min(0.25, reduction_percentage))
        
        # Calculate optimized margin
        optimized_margin = current_margin * (1 - reduction_percentage)
        
        # Calculate potential savings
        savings = current_margin - optimized_margin
        
        return {
            'current_margin': current_margin,
            'optimized_margin': float(optimized_margin),
            'reduction_percent': float(reduction_percentage * 100),
            'potential_savings': float(savings),
            'method': 'rule_based',
            'factors': {
                'base_reduction': float(base_reduction * 100),
                'volatility_factor': float(volatility_factor * 100),
                'index_factor': float(index_factor * 100),
                'sentiment_factor': float(sentiment_factor * 100),
                'correlation_factor': float(correlation_factor * 100)
            },
            'confidence': 0.65  # Lower confidence for rule-based approach
        }
    
    def train_model(self, training_data):
        """
        Train the margin optimization model
        
        Args:
            training_data (list): List of dictionaries containing historical data
                Each item should have:
                - features: Dict of feature values
                - actual_reduction: Float of actual margin reduction percentage
                
        Returns:
            dict: Training results
        """
        if not training_data or len(training_data) < 10:
            return {
                'success': False,
                'error': 'Insufficient training data (need at least 10 samples)'
            }
        
        try:
            # Prepare data
            X = pd.DataFrame([item['features'] for item in training_data])
            y = np.array([item['actual_reduction'] for item in training_data])
            
            # Store feature columns
            self.feature_columns = list(X.columns)
            
            # Train XGBoost model
            self.model = xgb.XGBRegressor(
                objective='reg:squarederror',
                n_estimators=100,
                max_depth=4,
                learning_rate=0.1,
                subsample=0.8,
                colsample_bytree=0.8,
                random_state=42
            )
            
            self.model.fit(X, y)
            
            # Save model
            self._save_model()
            
            # Calculate training metrics
            predictions = self.model.predict(X)
            mse = np.mean((predictions - y) ** 2)
            rmse = np.sqrt(mse)
            
            # Get feature importance
            importance = self.model.feature_importances_
            feature_importance = {
                feature: float(importance[i])
                for i, feature in enumerate(self.feature_columns)
            }
            
            return {
                'success': True,
                'model_trained': True,
                'training_samples': len(training_data),
                'rmse': float(rmse),
                'feature_importance': feature_importance
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }