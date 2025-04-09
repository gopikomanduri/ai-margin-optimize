import os
import webbrowser
import subprocess
import time
import threading
import platform

def open_browser():
    time.sleep(2)  # Give the server a moment to start
    print("Opening browser to demo application...")
    webbrowser.open('http://localhost:8080')

def main():
    print("Starting AI Margin Optimizer Demo")
    print("=" * 50)
    
    # Check if model exists, if not train a simple model
    if not os.path.exists('models/margin_optimizer_model.pkl'):
        print("Model not found, training a simple model...")
        from models.model_trainer import MarginOptimizerModelTrainer
        trainer = MarginOptimizerModelTrainer()
        trainer.generate_sample_training_data(20)
        trainer.train_model()
    
    # Start browser in a separate thread
    threading.Thread(target=open_browser).start()
    
    # Run demo application
    print("Starting demo server at http://localhost:8080")
    print("Press Ctrl+C to stop the demo")
    subprocess.call(["python", "demo.py"])

if __name__ == "__main__":
    main()