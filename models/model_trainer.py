import os
import pandas as pd
import numpy as np
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score
import pickle
import matplotlib.pyplot as plt
import json

class MarginOptimizerModelTrainer:
    def __init__(self):
        self.model_path = 'margin_optimizer_model.pkl'
        self.model = None
        self.feature_columns = None
        self.training_data = []
    
    def load_training_data(self, data_path):
        """
        Load training data from CSV file
        
        Args:
            data_path (str): Path to CSV file
            
        Returns:
            bool: True if successful
        """
        try:
            df = pd.read_csv(data_path)
            
            # Extract features and target
            X = df.drop(['actual_reduction'], axis=1)
            y = df['actual_reduction']
            
            self.feature_columns = list(X.columns)
            
            # Convert to training data format
            self.training_data = []
            for i in range(len(X)):
                features = {col: X.iloc[i][col] for col in X.columns}
                actual_reduction = y.iloc[i]
                self.training_data.append({
                    'features': features,
                    'actual_reduction': actual_reduction
                })
            
            print(f"Loaded {len(self.training_data)} training samples")
            return True
            
        except Exception as e:
            print(f"Error loading training data: {str(e)}")
            return False
    
    def generate_sample_training_data(self, num_samples=100):
        """
        Generate synthetic training data for demonstration
        
        Args:
            num_samples (int): Number of samples to generate
            
        Returns:
            bool: True if successful
        """
        try:
            # Define feature names and ranges
            features = {
                'positions_count': (1, 20),
                'holdings_count': (1, 30),
                'positions_to_holdings_ratio': (0.1, 2.0),
                'avg_volatility': (0.1, 0.5),
                'nifty_change_pct': (-2.0, 2.0),
                'banknifty_change_pct': (-2.0, 2.0),
                'sensex_change_pct': (-2.0, 2.0),
                'avg_correlation': (0.2, 0.9),
                'overall_sentiment_score': (-0.8, 0.8),
                'overall_sentiment_confidence': (0.3, 0.9),
                'avg_position_sentiment': (-0.8, 0.8),
                'current_margin': (100000, 1000000),
                'margin_per_position': (10000, 100000),
                'negative_positions_ratio': (0.0, 1.0)
            }
            
            # Generate synthetic samples
            self.training_data = []
            for _ in range(num_samples):
                sample_features = {}
                
                # Generate random values for each feature
                for feature, (min_val, max_val) in features.items():
                    sample_features[feature] = min_val + (max_val - min_val) * np.random.random()
                
                # Generate target value based on feature relationships
                # This is a simplified model of how these features might affect margin reduction
                
                # Base reduction
                reduction = 0.05
                
                # Volatility: Higher volatility means less margin reduction
                reduction -= sample_features['avg_volatility'] * 0.2
                
                # Market movement: Positive market means more reduction
                market_change = (
                    sample_features['nifty_change_pct'] + 
                    sample_features['banknifty_change_pct'] + 
                    sample_features['sensex_change_pct']
                ) / 3
                reduction += market_change * 0.01
                
                # Sentiment: Positive sentiment means more reduction
                sentiment_impact = (
                    sample_features['overall_sentiment_score'] * 
                    sample_features['overall_sentiment_confidence']
                ) * 0.05
                reduction += sentiment_impact
                
                # Correlation: Higher correlation means less diversification, less reduction
                reduction -= sample_features['avg_correlation'] * 0.05
                
                # Negative positions: More negative positions means less reduction
                reduction -= sample_features['negative_positions_ratio'] * 0.1
                
                # Add some random noise
                reduction += np.random.normal(0, 0.02)
                
                # Ensure reduction stays in reasonable bounds (5-25%)
                reduction = max(0.05, min(0.25, reduction))
                
                self.training_data.append({
                    'features': sample_features,
                    'actual_reduction': reduction
                })
            
            # Save to CSV for future use
            features_df = pd.DataFrame([item['features'] for item in self.training_data])
            features_df['actual_reduction'] = [item['actual_reduction'] for item in self.training_data]
            
            os.makedirs('data', exist_ok=True)
            features_df.to_csv('data/synthetic_training_data.csv', index=False)
            
            self.feature_columns = list(features.keys())
            print(f"Generated {num_samples} synthetic training samples")
            return True
            
        except Exception as e:
            print(f"Error generating training data: {str(e)}")
            return False
    
    def train_model(self):
        """
        Train XGBoost model on training data
        
        Returns:
            dict: Training results
        """
        if not self.training_data or len(self.training_data) < 10:
            return {
                'success': False,
                'error': 'Insufficient training data (need at least 10 samples)'
            }
        
        try:
            # Prepare data
            X = pd.DataFrame([item['features'] for item in self.training_data])
            y = np.array([item['actual_reduction'] for item in self.training_data])
            
            # Store feature columns
            self.feature_columns = list(X.columns)
            
            # Split data
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.2, random_state=42
            )
            
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
            
            self.model.fit(X_train, y_train)
            
            # Calculate metrics
            train_predictions = self.model.predict(X_train)
            test_predictions = self.model.predict(X_test)
            
            train_mse = mean_squared_error(y_train, train_predictions)
            test_mse = mean_squared_error(y_test, test_predictions)
            
            train_rmse = np.sqrt(train_mse)
            test_rmse = np.sqrt(test_mse)
            
            train_r2 = r2_score(y_train, train_predictions)
            test_r2 = r2_score(y_test, test_predictions)
            
            # Get feature importance
            importance = self.model.feature_importances_
            feature_importance = {
                feature: float(importance[i])
                for i, feature in enumerate(self.feature_columns)
            }
            
            # Plot feature importance
            self._plot_feature_importance(feature_importance)
            
            # Save model
            self._save_model()
            
            return {
                'success': True,
                'training_samples': len(self.training_data),
                'train_rmse': float(train_rmse),
                'test_rmse': float(test_rmse),
                'train_r2': float(train_r2),
                'test_r2': float(test_r2),
                'feature_importance': feature_importance
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def _save_model(self):
        """Save the model to disk"""
        if self.model and self.feature_columns:
            try:
                os.makedirs('models', exist_ok=True)
                with open(os.path.join('models', self.model_path), 'wb') as f:
                    model_data = {
                        'model': self.model,
                        'feature_columns': self.feature_columns
                    }
                    pickle.dump(model_data, f)
                print(f"Model saved to models/{self.model_path}")
            except Exception as e:
                print(f"Error saving model: {str(e)}")
    
    def _plot_feature_importance(self, feature_importance):
        """Plot feature importance"""
        try:
            # Sort features by importance
            sorted_features = dict(sorted(feature_importance.items(), key=lambda x: x[1], reverse=True))
            
            plt.figure(figsize=(10, 6))
            plt.barh(list(sorted_features.keys()), list(sorted_features.values()))
            plt.xlabel('Importance')
            plt.title('Feature Importance')
            plt.tight_layout()
            
            os.makedirs('static/images', exist_ok=True)
            plt.savefig('static/images/feature_importance.png')
            plt.close()
        except Exception as e:
            print(f"Error plotting feature importance: {str(e)}")

if __name__ == "__main__":
    # Example usage
    trainer = MarginOptimizerModelTrainer()
    
    # Generate synthetic data for demo
    trainer.generate_sample_training_data(num_samples=200)
    
    # Train model
    result = trainer.train_model()
    
    # Print results
    print(json.dumps(result, indent=2))