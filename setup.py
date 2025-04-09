import os
import sys
from dotenv import load_dotenv
from models.model_trainer import MarginOptimizerModelTrainer

def main():
    """
    Setup script to initialize the project:
    1. Check environment variables
    2. Train initial model
    """
    print("Starting setup for AI Margin Optimizer...")
    
    # Load environment variables
    load_dotenv()
    
    # Check for API keys
    api_keys = {
        'NEWS_API_KEY': os.getenv('NEWS_API_KEY'),
        'TWITTER_API_KEY': os.getenv('TWITTER_API_KEY'),
        'ICICI_API_KEY': os.getenv('ICICI_API_KEY'),
        'KOTAK_API_KEY': os.getenv('KOTAK_API_KEY'),
        'ANTHROPIC_API_KEY': os.getenv('ANTHROPIC_API_KEY')
    }
    
    print("\nChecking API keys:")
    for key, value in api_keys.items():
        status = "✓ Set" if value else "✗ Missing"
        print(f"  {key}: {status}")
    
    print("\nNote: The application will run in demo mode for any missing API keys.")
    
    # Train initial model
    print("\nTraining initial margin optimization model...")
    trainer = MarginOptimizerModelTrainer()
    
    # Generate synthetic data for initial training
    trainer.generate_sample_training_data(num_samples=200)
    
    # Train the model
    result = trainer.train_model()
    
    if result['success']:
        print(f"Model training successful:")
        print(f"  Training samples: {result['training_samples']}")
        print(f"  Train RMSE: {result['train_rmse']:.4f}")
        print(f"  Test RMSE: {result['test_rmse']:.4f}")
        print(f"  R² (train): {result['train_r2']:.4f}")
        print(f"  R² (test): {result['test_r2']:.4f}")
        
        # Print top 5 important features
        print("\nTop 5 most important features:")
        sorted_features = sorted(
            result['feature_importance'].items(), 
            key=lambda x: x[1], 
            reverse=True
        )[:5]
        
        for feature, importance in sorted_features:
            print(f"  {feature}: {importance:.4f}")
    else:
        print(f"Error training model: {result.get('error', 'Unknown error')}")
    
    print("\nSetup completed. You can now run the application with 'python app.py'")

if __name__ == "__main__":
    main()