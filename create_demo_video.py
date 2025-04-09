import time
import os
import sys
from PIL import Image, ImageDraw, ImageFont
import numpy as np
from services.broker_service import BrokerService
from services.market_service import MarketService
from services.news_service import NewsService
from services.sentiment_service import SentimentService
from services.prediction_service import PredictionService
from models.model_trainer import MarginOptimizerModelTrainer

# Configure demo parameters
NUM_FRAMES = 50
OUTPUT_DIR = "demo_frames"
WIDTH, HEIGHT = 1280, 720
BG_COLOR = (240, 245, 250)
TEXT_COLOR = (30, 50, 70)
HIGHLIGHT_COLOR = (13, 110, 253)
POSITIVE_COLOR = (25, 135, 84)
NEGATIVE_COLOR = (220, 53, 69)
NEUTRAL_COLOR = (108, 117, 125)

def create_directory(dir_path):
    if not os.path.exists(dir_path):
        os.makedirs(dir_path)

def generate_demo_frame(frame_num, total_frames, portfolio, market_data, news_data, sentiment_data, optimization_result=None):
    # Create a blank image
    img = Image.new('RGB', (WIDTH, HEIGHT), BG_COLOR)
    draw = ImageDraw.Draw(img)
    
    try:
        # Load fonts (use default if custom font fails)
        try:
            title_font = ImageFont.truetype("arial.ttf", 36)
            heading_font = ImageFont.truetype("arial.ttf", 24)
            regular_font = ImageFont.truetype("arial.ttf", 18)
            small_font = ImageFont.truetype("arial.ttf", 14)
        except IOError:
            title_font = ImageFont.load_default()
            heading_font = ImageFont.load_default()
            regular_font = ImageFont.load_default()
            small_font = ImageFont.load_default()
        
        # Draw title
        draw.text((WIDTH//2, 40), "AI Margin Optimizer for F&O Large Traders", 
                  font=title_font, fill=HIGHLIGHT_COLOR, anchor="mm")
        draw.text((WIDTH//2, 80), "Reduce over-pledging of collateral by 20-30% using AI-powered optimization", 
                  font=regular_font, fill=TEXT_COLOR, anchor="mm")
        
        # Draw header bar
        draw.rectangle([(0, 100), (WIDTH, 102)], fill=HIGHLIGHT_COLOR)
        
        # Draw account summary (left panel)
        draw.text((50, 130), "Account Summary", font=heading_font, fill=TEXT_COLOR)
        draw.rectangle([(30, 160), (380, 340)], outline=HIGHLIGHT_COLOR, width=2)
        
        account_value = portfolio.get('total_value', 1500000)
        current_margin = portfolio.get('used_margin', 350000)
        
        # If optimization result exists, use those values
        if optimization_result:
            optimized_margin = optimization_result.get('optimized_margin')
            reduction_percent = optimization_result.get('reduction_percent')
            confidence = optimization_result.get('confidence', 0.85)
            savings = current_margin - optimized_margin
        else:
            optimized_margin = current_margin
            reduction_percent = 0
            confidence = 0
            savings = 0
        
        draw.text((50, 180), f"Account Value:", font=regular_font, fill=TEXT_COLOR)
        draw.text((360, 180), f"₹{account_value:,.2f}", font=regular_font, fill=TEXT_COLOR, anchor="ra")
        
        draw.text((50, 210), f"Current Margin:", font=regular_font, fill=TEXT_COLOR)
        draw.text((360, 210), f"₹{current_margin:,.2f}", font=regular_font, fill=TEXT_COLOR, anchor="ra")
        
        draw.text((50, 240), f"Optimized Margin:", font=regular_font, fill=TEXT_COLOR)
        draw.text((360, 240), f"₹{optimized_margin:,.2f}", font=regular_font, fill=POSITIVE_COLOR, anchor="ra")
        
        draw.text((50, 270), f"Potential Savings:", font=regular_font, fill=TEXT_COLOR)
        draw.text((360, 270), f"₹{savings:,.2f}", font=regular_font, fill=POSITIVE_COLOR, anchor="ra")
        
        draw.text((50, 300), f"Reduction:", font=regular_font, fill=TEXT_COLOR)
        draw.text((360, 300), f"{reduction_percent}%", font=regular_font, fill=POSITIVE_COLOR, anchor="ra")
        
        # Draw confidence bar
        confidence_width = int(320 * confidence)
        draw.rectangle([(40, 330), (360, 340)], outline=HIGHLIGHT_COLOR, width=1)
        draw.rectangle([(40, 330), (40 + confidence_width, 340)], fill=HIGHLIGHT_COLOR)
        draw.text((200, 360), f"AI Confidence: {int(confidence * 100)}%", font=small_font, fill=TEXT_COLOR, anchor="mm")
        
        # Draw optimization button
        button_color = HIGHLIGHT_COLOR if frame_num > total_frames // 3 else (180, 180, 180)
        draw.rounded_rectangle([(80, 380), (330, 420)], radius=5, fill=button_color)
        draw.text((205, 400), "Optimize Margin", font=regular_font, fill=(255, 255, 255), anchor="mm")
        
        # Draw sentiment analysis (right panel)
        draw.text((WIDTH - 220, 130), "News Sentiment", font=heading_font, fill=TEXT_COLOR)
        draw.rectangle([(WIDTH - 380, 160), (WIDTH - 30, 340)], outline=HIGHLIGHT_COLOR, width=2)
        
        # Count sentiment
        positive = 0
        negative = 0
        neutral = 0
        for score in sentiment_data.values():
            if score.get('label') == 'positive':
                positive += 1
            elif score.get('label') == 'negative':
                negative += 1
            else:
                neutral += 1
        
        total = positive + negative + neutral
        if total > 0:
            pos_percent = int(positive / total * 100)
            neg_percent = int(negative / total * 100)
            neu_percent = 100 - pos_percent - neg_percent
        else:
            pos_percent = neu_percent = neg_percent = 0
        
        # Draw pie chart
        center_x, center_y = WIDTH - 205, 220
        radius = 80
        
        # Draw sentiment pie segments
        if total > 0:
            # Positive segment
            if pos_percent > 0:
                angle_pos = pos_percent * 3.6  # Convert to degrees (100% = 360 degrees)
                draw.pieslice([center_x - radius, center_y - radius, center_x + radius, center_y + radius], 
                              start=0, end=angle_pos, fill=POSITIVE_COLOR)
            
            # Neutral segment
            if neu_percent > 0:
                angle_neu = neu_percent * 3.6
                draw.pieslice([center_x - radius, center_y - radius, center_x + radius, center_y + radius], 
                              start=angle_pos, end=angle_pos + angle_neu, fill=NEUTRAL_COLOR)
            
            # Negative segment
            if neg_percent > 0:
                draw.pieslice([center_x - radius, center_y - radius, center_x + radius, center_y + radius], 
                              start=angle_pos + angle_neu, end=360, fill=NEGATIVE_COLOR)
        else:
            # Empty pie
            draw.ellipse([center_x - radius, center_y - radius, center_x + radius, center_y + radius], 
                          outline=TEXT_COLOR)
        
        # Draw sentiment legend
        draw.rectangle([(WIDTH - 340, 300), (WIDTH - 320, 310)], fill=POSITIVE_COLOR)
        draw.text((WIDTH - 310, 305), f"Positive: {positive} ({pos_percent}%)", font=small_font, fill=TEXT_COLOR, anchor="lm")
        
        draw.rectangle([(WIDTH - 340, 320), (WIDTH - 320, 330)], fill=NEUTRAL_COLOR)
        draw.text((WIDTH - 310, 325), f"Neutral: {neutral} ({neu_percent}%)", font=small_font, fill=TEXT_COLOR, anchor="lm")
        
        draw.rectangle([(WIDTH - 340, 340), (WIDTH - 320, 350)], fill=NEGATIVE_COLOR)
        draw.text((WIDTH - 310, 345), f"Negative: {negative} ({neg_percent}%)", font=small_font, fill=TEXT_COLOR, anchor="lm")
        
        # Draw market data (center)
        draw.text((WIDTH//2, 130), "Market Overview", font=heading_font, fill=TEXT_COLOR, anchor="mt")
        
        # Draw table headers
        y_pos = 170
        draw.text((WIDTH//2 - 150, y_pos), "Index", font=regular_font, fill=TEXT_COLOR)
        draw.text((WIDTH//2 - 50, y_pos), "Value", font=regular_font, fill=TEXT_COLOR)
        draw.text((WIDTH//2 + 50, y_pos), "Change", font=regular_font, fill=TEXT_COLOR)
        draw.text((WIDTH//2 + 150, y_pos), "% Change", font=regular_font, fill=TEXT_COLOR)
        
        y_pos += 30
        draw.line([(WIDTH//2 - 200, y_pos - 10), (WIDTH//2 + 200, y_pos - 10)], fill=TEXT_COLOR, width=1)
        
        # Draw table rows
        indices = market_data.get('indices', {})
        for i, (index, details) in enumerate(indices.items()):
            if i >= 3:  # Only show top 3 indices
                break
                
            change_color = POSITIVE_COLOR if details.get('change_1d', 0) >= 0 else NEGATIVE_COLOR
            change_symbol = "▲" if details.get('change_1d', 0) >= 0 else "▼"
            
            draw.text((WIDTH//2 - 150, y_pos), index, font=regular_font, fill=TEXT_COLOR)
            draw.text((WIDTH//2 - 50, y_pos), f"{details.get('current', 0):,.2f}", font=regular_font, fill=TEXT_COLOR)
            
            change_text = f"{change_symbol} {abs(details.get('change_1d', 0)):,.2f}"
            draw.text((WIDTH//2 + 50, y_pos), change_text, font=regular_font, fill=change_color)
            
            percent_text = f"{change_symbol} {abs(details.get('change_percent_1d', 0)):,.2f}%"
            draw.text((WIDTH//2 + 150, y_pos), percent_text, font=regular_font, fill=change_color)
            
            y_pos += 30
        
        # Draw news section at bottom
        draw.text((WIDTH//2, 440), "Recent News Affecting Your Portfolio", font=heading_font, fill=TEXT_COLOR, anchor="mt")
        
        # Draw news items
        news_items = news_data if isinstance(news_data, list) else []
        for i, news in enumerate(news_items[:3]):
            # Calculate position for this news item
            x_start = 30 + i * (WIDTH // 3)
            x_end = x_start + (WIDTH // 3) - 30
            
            # Draw news card
            draw.rounded_rectangle([(x_start, 480), (x_end, 650)], radius=5, fill=(255, 255, 255), outline=HIGHLIGHT_COLOR)
            
            # Draw news content
            title = news.get('title', 'News Title')
            title_lines = wrap_text(title, regular_font, x_end - x_start - 20)
            
            for j, line in enumerate(title_lines):
                draw.text((x_start + 10, 490 + j * 25), line, font=regular_font, fill=TEXT_COLOR)
            
            source = news.get('source', 'Source')
            date = news.get('published_at', 'Date')[:10]
            draw.text((x_start + 10, 550), f"Source: {source}", font=small_font, fill=TEXT_COLOR)
            draw.text((x_start + 10, 570), f"Date: {date}", font=small_font, fill=TEXT_COLOR)
            
            summary = news.get('summary', '')
            summary_lines = wrap_text(summary, small_font, x_end - x_start - 20)
            
            for j, line in enumerate(summary_lines[:3]):  # Show only first 3 lines of summary
                draw.text((x_start + 10, 590 + j * 20), line, font=small_font, fill=TEXT_COLOR)
        
        # Draw footer
        draw.rectangle([(0, HEIGHT - 40), (WIDTH, HEIGHT)], fill=(230, 235, 240))
        draw.text((WIDTH//2, HEIGHT - 20), "© 2025 AI Margin Optimizer | Powered by ML & AI | For demonstration purposes only", 
                 font=small_font, fill=TEXT_COLOR, anchor="mm")
        
        # Animation effect - Highlight optimization results
        if frame_num > total_frames // 2 and optimization_result:
            # Pulsating highlight
            pulse = abs(np.sin(frame_num / 5))
            highlight_alpha = int(150 + 105 * pulse)  # 150-255 range
            highlight_width = int(2 + 3 * pulse)  # 2-5 range
            
            # Highlight the optimized margin and reduction
            draw.rectangle([(30, 230), (380, 310)], 
                           outline=(HIGHLIGHT_COLOR[0], HIGHLIGHT_COLOR[1], HIGHLIGHT_COLOR[2], highlight_alpha), 
                           width=highlight_width)
            
        # Progress indicator
        progress = frame_num / total_frames
        draw.rectangle([(0, HEIGHT - 5), (int(WIDTH * progress), HEIGHT)], fill=HIGHLIGHT_COLOR)
        
    except Exception as e:
        # If there's an error, at least show it on the image
        draw.text((WIDTH//2, HEIGHT//2), f"Error generating frame: {str(e)}", 
                 font=regular_font, fill=NEGATIVE_COLOR, anchor="mm")
        
    return img

def wrap_text(text, font, max_width):
    """Wrap text to fit within specified width"""
    words = text.split()
    lines = []
    current_line = []
    
    for word in words:
        # Add word to current line
        current_line.append(word)
        
        # Check if current line is too wide
        line_text = ' '.join(current_line)
        try:
            line_width = font.getsize(line_text)[0]
        except:
            # If getsize is not available, estimate width
            line_width = len(line_text) * 7  # rough estimate
        
        if line_width > max_width:
            # Line is too wide, remove last word and start new line
            if len(current_line) > 1:
                current_line.pop()
                lines.append(' '.join(current_line))
                current_line = [word]
            else:
                # Single word is too long, just add it anyway
                lines.append(line_text)
                current_line = []
    
    # Add the last line if there's anything left
    if current_line:
        lines.append(' '.join(current_line))
    
    return lines

def create_demo_video():
    print("Creating demo video frames...")
    
    # Initialize services
    broker = BrokerService()
    market = MarketService()
    news = NewsService()
    sentiment = SentimentService()
    prediction = PredictionService()
    
    # Make sure model exists
    if not os.path.exists('models/margin_optimizer_model.pkl'):
        print("Model not found, training a simple model...")
        trainer = MarginOptimizerModelTrainer()
        trainer.generate_sample_training_data(20)
        trainer.train_model()
    
    # Get data
    portfolio = broker.get_portfolio()
    market_data = market.get_market_data(portfolio)
    
    # Get news data - use demo data if API unavailable
    news_data = news.get_news_for_portfolio(portfolio)
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
    
    # Get sentiment data
    sentiment_data = sentiment.analyze_sentiment(news_data)
    if not sentiment_data:
        sentiment_data = {
            "RELIANCE.NS": {"score": 0.75, "label": "positive"},
            "HDFCBANK.NS": {"score": 0.65, "label": "positive"},
            "TCS.NS": {"score": 0.45, "label": "neutral"},
            "INFY.NS": {"score": 0.60, "label": "positive"},
            "ICICIBANK.NS": {"score": 0.55, "label": "positive"}
        }
    
    # Create optimization result at certain point in animation
    optimization_result = None
    
    # Create output directory
    create_directory(OUTPUT_DIR)
    
    # Generate frames
    for i in range(NUM_FRAMES):
        print(f"Generating frame {i+1}/{NUM_FRAMES}")
        
        # After certain point, show optimization result
        if i >= NUM_FRAMES // 3:
            if not optimization_result:
                # Generate optimization result once
                optimization_result = prediction.predict_optimal_margin(portfolio, market_data, sentiment_data)
                print("Optimization result:")
                print(f"Current margin: {optimization_result.get('current_margin')}")
                print(f"Optimized margin: {optimization_result.get('optimized_margin')}")
                print(f"Reduction: {optimization_result.get('reduction_percent')}%")
        
        # Generate the frame
        frame = generate_demo_frame(i, NUM_FRAMES, portfolio, market_data, news_data, sentiment_data, optimization_result)
        
        # Save the frame
        frame.save(f"{OUTPUT_DIR}/frame_{i:04d}.png")
    
    print(f"Demo frames generated in '{OUTPUT_DIR}' directory")
    print(f"Total frames: {NUM_FRAMES}")
    print("To create a video, you can use:")
    print(f"ffmpeg -r 10 -i {OUTPUT_DIR}/frame_%04d.png -c:v libx264 -pix_fmt yuv420p -crf 23 demo_video.mp4")

if __name__ == "__main__":
    create_demo_video()