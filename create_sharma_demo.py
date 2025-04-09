import time
import os
import sys
from PIL import Image, ImageDraw, ImageFont
import numpy as np

# Configure demo parameters
NUM_FRAMES = 100
OUTPUT_DIR = "sharma_demo_frames"
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

def draw_text_with_shadow(draw, text, position, font, color, shadow_color=(200, 200, 200)):
    """Draw text with a subtle shadow effect"""
    shadow_offset = 2
    # Draw shadow
    draw.text((position[0] + shadow_offset, position[1] + shadow_offset), text, font=font, fill=shadow_color)
    # Draw text
    draw.text(position, text, font=font, fill=color)

def generate_demo_frame(frame_num, total_frames):
    # Create a blank image
    img = Image.new('RGB', (WIDTH, HEIGHT), BG_COLOR)
    draw = ImageDraw.Draw(img)
    
    try:
        # Load fonts (use default if custom font fails)
        try:
            title_font = ImageFont.truetype("arial.ttf", 36)
            heading_font = ImageFont.truetype("arial.ttf", 28)
            regular_font = ImageFont.truetype("arial.ttf", 20)
            small_font = ImageFont.truetype("arial.ttf", 16)
        except IOError:
            title_font = ImageFont.load_default()
            heading_font = ImageFont.load_default()
            regular_font = ImageFont.load_default()
            small_font = ImageFont.load_default()
        
        # Determine which scene to show based on frame number
        scene = 1
        if frame_num < 15:
            scene = 1  # Introduction
        elif frame_num < 30:
            scene = 2  # Morning Review
        elif frame_num < 45:
            scene = 3  # Understanding Recommendation
        elif frame_num < 60:
            scene = 4  # Taking Action
        elif frame_num < 75:
            scene = 5  # New Opportunity
        elif frame_num < 90:
            scene = 6  # Weekly Review
        else:
            scene = 7  # Conclusion
        
        # Draw header with logo
        draw.rectangle([(0, 0), (WIDTH, 70)], fill=(20, 30, 70))
        draw_text_with_shadow(draw, "AI Margin Optimizer", (30, 15), title_font, (255, 255, 255))
        draw.text((WIDTH - 200, 25), "Mr. Sharma's Journey", font=regular_font, fill=(220, 220, 255))
        
        # Draw scene title
        scene_titles = {
            1: "Introduction - Meet Mr. Sharma",
            2: "Morning Review - Discovering Potential",
            3: "Understanding the Recommendation",
            4: "Taking Action - Freeing Up Capital",
            5: "New Opportunity - Putting Capital to Work",
            6: "Weekly Review - Measuring Success",
            7: "Conclusion - Capital Unleashed"
        }
        draw.rectangle([(0, 70), (WIDTH, 110)], fill=(240, 240, 255))
        draw.text((WIDTH//2, 90), scene_titles[scene], font=heading_font, fill=(20, 30, 70), anchor="mm")
        
        # Draw scene content based on the current scene
        if scene == 1:
            # Introduction scene
            # Draw a profile silhouette
            draw.ellipse([(WIDTH//2 - 80, 150), (WIDTH//2 + 80, 310)], fill=(50, 60, 100))
            draw.ellipse([(WIDTH//2 - 60, 180), (WIDTH//2 + 60, 300)], fill=BG_COLOR)
            
            # Portfolio details
            draw.rounded_rectangle([(WIDTH//2 - 300, 340), (WIDTH//2 + 300, 500)], radius=10, fill=(255, 255, 255), outline=HIGHLIGHT_COLOR)
            draw.text((WIDTH//2, 360), "Mr. Sharma's Portfolio", font=heading_font, fill=TEXT_COLOR, anchor="mm")
            
            details = [
                "Total Portfolio Value: ₹1,50,00,000",
                "Trading Experience: 7 years",
                "Primary Focus: F&O Trading",
                "Trading Style: Swing + Intraday",
                "Typical Positions: 8-12 active at a time"
            ]
            
            for i, detail in enumerate(details):
                draw.text((WIDTH//2 - 250, 400 + i*25), detail, font=regular_font, fill=TEXT_COLOR)
            
            # Calendar showing Tuesday
            if frame_num % 15 < 7:
                # Show calendar
                draw.rounded_rectangle([(WIDTH//2 - 150, 520), (WIDTH//2 + 150, 650)], radius=5, fill=(255, 255, 255), outline=HIGHLIGHT_COLOR)
                draw.text((WIDTH//2, 535), "April 2025", font=regular_font, fill=TEXT_COLOR, anchor="mm")
                
                days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
                for i, day in enumerate(days):
                    draw.text((WIDTH//2 - 120 + i*40, 565), day, font=small_font, fill=TEXT_COLOR, anchor="mm")
                
                # Draw calendar grid
                for row in range(5):
                    for col in range(7):
                        day_num = row*7 + col - 1  # Offset to start from 1st
                        if 0 < day_num < 31:  # April has 30 days
                            x = WIDTH//2 - 120 + col*40
                            y = 590 + row*30
                            
                            # Highlight Tuesday the 9th
                            if day_num == 9 and col == 2:  # Tuesday
                                draw.ellipse([(x-15, y-15), (x+15, y+15)], fill=HIGHLIGHT_COLOR)
                                draw.text((x, y), str(day_num), font=small_font, fill=(255, 255, 255), anchor="mm")
                            else:
                                draw.text((x, y), str(day_num), font=small_font, fill=TEXT_COLOR, anchor="mm")
            else:
                # Show clock at 9:15 AM
                draw.ellipse([(WIDTH//2 - 70, 530), (WIDTH//2 + 70, 670)], outline=HIGHLIGHT_COLOR, width=3)
                # Hour hand (pointing at 9)
                angle = np.pi/2 - (9/12) * 2*np.pi
                hour_length = 40
                hx = WIDTH//2 + int(hour_length * np.cos(angle))
                hy = 600 - int(hour_length * np.sin(angle))
                draw.line([(WIDTH//2, 600), (hx, hy)], fill=TEXT_COLOR, width=4)
                
                # Minute hand (pointing at 15 minutes)
                angle = np.pi/2 - (15/60) * 2*np.pi
                minute_length = 55
                mx = WIDTH//2 + int(minute_length * np.cos(angle))
                my = 600 - int(minute_length * np.sin(angle))
                draw.line([(WIDTH//2, 600), (mx, my)], fill=HIGHLIGHT_COLOR, width=3)
                
                # Add AM/PM and time text
                draw.text((WIDTH//2, 510), "Morning", font=regular_font, fill=TEXT_COLOR, anchor="mm")
                draw.text((WIDTH//2, 690), "9:15 AM", font=heading_font, fill=HIGHLIGHT_COLOR, anchor="mm")
            
        elif scene == 2:
            # Morning Review scene
            # Draw smartphone with app
            phone_width, phone_height = 300, 600
            phone_x, phone_y = WIDTH//2 - phone_width//2, 130
            
            # Phone outline
            draw.rounded_rectangle(
                [(phone_x, phone_y), (phone_x + phone_width, phone_y + phone_height)], 
                radius=20, fill=(20, 20, 20)
            )
            
            # Phone screen
            screen_margin = 10
            draw.rounded_rectangle(
                [(phone_x + screen_margin, phone_y + screen_margin), 
                 (phone_x + phone_width - screen_margin, phone_y + phone_height - screen_margin)], 
                radius=15, fill=(255, 255, 255)
            )
            
            # App header
            draw.rectangle(
                [(phone_x + screen_margin, phone_y + screen_margin), 
                 (phone_x + phone_width - screen_margin, phone_y + screen_margin + 40)], 
                fill=HIGHLIGHT_COLOR
            )
            draw.text(
                (phone_x + phone_width//2, phone_y + screen_margin + 20), 
                "AI Margin Optimizer", 
                font=small_font, fill=(255, 255, 255), anchor="mm"
            )
            
            # Account summary
            summary_y = phone_y + screen_margin + 60
            draw.text(
                (phone_x + phone_width//2, summary_y), 
                "Account Summary", 
                font=regular_font, fill=TEXT_COLOR, anchor="mm"
            )
            
            # Animate the discovery of margin difference
            progress = min(1.0, (frame_num - 15) / 10)  # Animation progresses from frame 15-25
            
            # Account value
            draw.text(
                (phone_x + screen_margin + 20, summary_y + 40), 
                "Account Value:", 
                font=small_font, fill=TEXT_COLOR
            )
            draw.text(
                (phone_x + phone_width - screen_margin - 20, summary_y + 40), 
                "₹1,50,00,000", 
                font=small_font, fill=TEXT_COLOR, anchor="ra"
            )
            
            # Current margin
            draw.text(
                (phone_x + screen_margin + 20, summary_y + 70), 
                "Current Margin:", 
                font=small_font, fill=TEXT_COLOR
            )
            
            # Highlight current margin if animation has progressed
            if progress > 0.3:
                highlight_alpha = int(min(1.0, (progress - 0.3) / 0.3) * 255)
                highlight_rect = [
                    (phone_x + phone_width - screen_margin - 120, summary_y + 65),
                    (phone_x + phone_width - screen_margin - 20, summary_y + 90)
                ]
                highlight_color = (255, 240, 200, highlight_alpha)
                draw.rectangle(highlight_rect, fill=highlight_color)
            
            draw.text(
                (phone_x + phone_width - screen_margin - 20, summary_y + 70), 
                "₹42,00,000", 
                font=small_font, fill=TEXT_COLOR, anchor="ra"
            )
            
            # Optimized margin (appears gradually)
            if progress > 0.5:
                fade_in = min(1.0, (progress - 0.5) / 0.3)
                # Convert to RGB with appropriate alpha
                text_color_with_alpha = (
                    TEXT_COLOR[0], 
                    TEXT_COLOR[1], 
                    TEXT_COLOR[2], 
                    int(fade_in * 255)
                )
                
                draw.text(
                    (phone_x + screen_margin + 20, summary_y + 100), 
                    "Optimized Margin:", 
                    font=small_font, fill=text_color_with_alpha
                )
                
                # Highlight optimized margin
                highlight_rect = [
                    (phone_x + phone_width - screen_margin - 120, summary_y + 95),
                    (phone_x + phone_width - screen_margin - 20, summary_y + 120)
                ]
                highlight_color = (230, 255, 230, int(fade_in * 255))
                draw.rectangle(highlight_rect, fill=highlight_color)
                
                draw.text(
                    (phone_x + phone_width - screen_margin - 20, summary_y + 100), 
                    "₹30,00,000", 
                    font=small_font, fill=POSITIVE_COLOR, anchor="ra"
                )
            
            # Potential savings (appears last)
            if progress > 0.7:
                fade_in = min(1.0, (progress - 0.7) / 0.3)
                # Convert to RGB with appropriate alpha
                pos_color_with_alpha = (
                    POSITIVE_COLOR[0], 
                    POSITIVE_COLOR[1], 
                    POSITIVE_COLOR[2], 
                    int(fade_in * 255)
                )
                
                draw.text(
                    (phone_x + screen_margin + 20, summary_y + 140), 
                    "Potential Savings:", 
                    font=regular_font, fill=pos_color_with_alpha
                )
                
                saving_text = "₹12,00,000"
                draw.text(
                    (phone_x + phone_width - screen_margin - 20, summary_y + 140), 
                    saving_text, 
                    font=regular_font, fill=pos_color_with_alpha, anchor="ra"
                )
            
            # Confidence score
            confidence_y = summary_y + 180
            if progress > 0.9:
                draw.text(
                    (phone_x + phone_width//2, confidence_y), 
                    "AI Confidence Score", 
                    font=small_font, fill=TEXT_COLOR, anchor="mm"
                )
                
                # Confidence bar
                bar_width = phone_width - screen_margin*2 - 40
                bar_x = phone_x + screen_margin + 20
                bar_y = confidence_y + 30
                
                # Bar background
                draw.rectangle(
                    [(bar_x, bar_y), (bar_x + bar_width, bar_y + 20)], 
                    outline=TEXT_COLOR, width=1
                )
                
                # Bar fill (85% confidence)
                confidence = 0.85
                fill_width = int(bar_width * confidence)
                draw.rectangle(
                    [(bar_x, bar_y), (bar_x + fill_width, bar_y + 20)], 
                    fill=HIGHLIGHT_COLOR
                )
                
                # Confidence percentage
                draw.text(
                    (bar_x + bar_width//2, bar_y + 30), 
                    f"{int(confidence * 100)}% Confidence", 
                    font=small_font, fill=TEXT_COLOR, anchor="mm"
                )
            
            # Narration text at bottom
            draw.rounded_rectangle(
                [(100, HEIGHT - 100), (WIDTH - 100, HEIGHT - 30)], 
                radius=10, fill=(0, 0, 0, 150)
            )
            
            narration = "Mr. Sharma sees that ₹12 lakhs of his capital could be freed up today!"
            draw.text(
                (WIDTH//2, HEIGHT - 65), 
                narration, 
                font=regular_font, fill=(255, 255, 255), anchor="mm"
            )
            
        elif scene == 3:
            # Understanding the Recommendation scene
            # Draw a details screen showing factors
            screen_x, screen_y = 50, 120
            screen_width, screen_height = WIDTH - 100, HEIGHT - 200
            
            # Screen background
            draw.rounded_rectangle(
                [(screen_x, screen_y), (screen_x + screen_width, screen_y + screen_height)], 
                radius=10, fill=(255, 255, 255), outline=HIGHLIGHT_COLOR
            )
            
            # Screen header
            draw.rectangle(
                [(screen_x, screen_y), (screen_x + screen_width, screen_y + 50)], 
                fill=HIGHLIGHT_COLOR
            )
            draw.text(
                (screen_x + screen_width//2, screen_y + 25), 
                "Optimization Details", 
                font=heading_font, fill=(255, 255, 255), anchor="mm"
            )
            
            # Animation progress
            progress = min(1.0, (frame_num - 30) / 14)
            
            # Left side - Factors that changed
            factors_x = screen_x + 30
            factors_y = screen_y + 70
            draw.text(
                (factors_x, factors_y), 
                "Factors Enabling Optimization", 
                font=regular_font, fill=TEXT_COLOR
            )
            
            factors = [
                "✓ Positive news for key holdings",
                "✓ Decreased position correlation",
                "✓ Stabilized sector volatility"
            ]
            
            for i, factor in enumerate(factors):
                # Only show factor if it's time in the animation
                if progress > (i * 0.25):
                    factor_alpha = min(1.0, (progress - (i * 0.25)) / 0.2)
                    factor_y = factors_y + 40 + i*40
                    
                    # Draw highlight background
                    highlight_rect = [
                        (factors_x - 10, factor_y - 5),
                        (factors_x + 350, factor_y + 25)
                    ]
                    highlight_color = (240, 255, 240, int(factor_alpha * 255))
                    draw.rectangle(highlight_rect, fill=highlight_color)
                    
                    # Draw factor text
                    draw.text(
                        (factors_x, factor_y), 
                        factor, 
                        font=regular_font, fill=TEXT_COLOR
                    )
            
            # Right side - Radar chart for factors (simplified representation)
            if progress > 0.75:
                chart_x = screen_x + screen_width - 250
                chart_y = screen_y + 150
                chart_radius = 120
                
                # Draw chart axes
                for angle in range(0, 360, 72):  # 5 axes at 72 degrees each
                    rad = np.radians(angle)
                    end_x = chart_x + int(chart_radius * np.cos(rad))
                    end_y = chart_y + int(chart_radius * np.sin(rad))
                    draw.line([(chart_x, chart_y), (end_x, end_y)], fill=(200, 200, 200), width=1)
                
                # Draw circular guidelines
                for r in range(40, chart_radius+1, 40):
                    draw.ellipse(
                        [(chart_x - r, chart_y - r), (chart_x + r, chart_y + r)], 
                        outline=(200, 200, 200)
                    )
                
                # Factor values (scale 0-1)
                factor_values = [0.8, 0.7, 0.9, 0.65, 0.75]  # Market, News, Volatility, Correlation, Macro
                factor_names = ["Market", "News", "Volatility", "Correlation", "Macro"]
                
                # Draw data points and connect them
                points = []
                for i, value in enumerate(factor_values):
                    angle = np.radians(i * 72)
                    point_distance = value * chart_radius
                    point_x = chart_x + int(point_distance * np.cos(angle))
                    point_y = chart_y + int(point_distance * np.sin(angle))
                    points.append((point_x, point_y))
                    
                    # Draw point
                    draw.ellipse([(point_x-5, point_y-5), (point_x+5, point_y+5)], fill=HIGHLIGHT_COLOR)
                    
                    # Draw factor name
                    label_distance = chart_radius + 20
                    label_x = chart_x + int(label_distance * np.cos(angle))
                    label_y = chart_y + int(label_distance * np.sin(angle))
                    draw.text((label_x, label_y), factor_names[i], font=small_font, fill=TEXT_COLOR, anchor="mm")
                
                # Connect points to form polygon
                points.append(points[0])  # Close the shape
                draw.polygon(points, fill=(13, 110, 253, 100), outline=HIGHLIGHT_COLOR)
            
            # Bottom explanation
            explanation_y = screen_y + screen_height - 100
            if progress > 0.9:
                draw.rectangle(
                    [(screen_x + 20, explanation_y), (screen_x + screen_width - 20, explanation_y + 80)], 
                    fill=(240, 245, 255), outline=(200, 210, 230)
                )
                
                draw.text(
                    (screen_x + screen_width//2, explanation_y + 40), 
                    "The AI model analyzes these factors together to determine the optimal margin,\n" +
                    "going beyond traditional margin calculations for a more precise result.", 
                    font=regular_font, fill=TEXT_COLOR, anchor="mm"
                )
            
            # Narration text
            draw.rounded_rectangle(
                [(100, HEIGHT - 100), (WIDTH - 100, HEIGHT - 30)], 
                radius=10, fill=(0, 0, 0, 150)
            )
            
            narration = "Mr. Sharma reviews why this optimization is possible, based on multiple factors"
            draw.text(
                (WIDTH//2, HEIGHT - 65), 
                narration, 
                font=regular_font, fill=(255, 255, 255), anchor="mm"
            )
            
        elif scene == 4:
            # Taking Action scene
            # Draw step-by-step instructions
            progress = min(1.0, (frame_num - 45) / 14)
            
            # Instructions panel
            panel_x, panel_y = 100, 130
            panel_width, panel_height = WIDTH - 200, HEIGHT - 250
            
            draw.rounded_rectangle(
                [(panel_x, panel_y), (panel_x + panel_width, panel_y + panel_height)], 
                radius=10, fill=(255, 255, 255), outline=HIGHLIGHT_COLOR
            )
            
            # Panel header
            draw.rectangle(
                [(panel_x, panel_y), (panel_x + panel_width, panel_y + 50)], 
                fill=HIGHLIGHT_COLOR
            )
            draw.text(
                (panel_x + panel_width//2, panel_y + 25), 
                "Action Steps - Zerodha Kite", 
                font=heading_font, fill=(255, 255, 255), anchor="mm"
            )
            
            # Steps
            steps = [
                "1. Navigate to Margins section in Zerodha Kite",
                "2. Update specified margin values for these positions:",
                "   • RELIANCE JUN FUT: Reduce from ₹4,25,000 to ₹3,40,000",
                "   • HDFCBANK JUN FUT: Reduce from ₹3,80,000 to ₹2,85,000",
                "   • NIFTY 19500 CALL: Reduce from ₹2,50,000 to ₹1,80,000",
                "3. Confirm adjustments by clicking 'Update Margins'"
            ]
            
            step_y = panel_y + 70
            for i, step in enumerate(steps):
                # Only show step if it's time in the animation
                if progress > (i * 0.15):
                    step_alpha = min(1.0, (progress - (i * 0.15)) / 0.1)
                    
                    if i == 1:  # Add extra space before position details
                        step_y += 10
                    
                    # Draw step with fade-in effect
                    text_color_alpha = (
                        TEXT_COLOR[0], 
                        TEXT_COLOR[1], 
                        TEXT_COLOR[2], 
                        int(step_alpha * 255)
                    )
                    
                    # Highlight the current step being explained
                    if i == int(progress / 0.15) and progress < 0.9:
                        highlight_rect = [
                            (panel_x + 20, step_y - 5),
                            (panel_x + panel_width - 20, step_y + 25)
                        ]
                        draw.rectangle(highlight_rect, fill=(255, 255, 200))
                    
                    draw.text(
                        (panel_x + 40, step_y), 
                        step, 
                        font=regular_font, fill=TEXT_COLOR
                    )
                    
                    step_y += 35
            
            # One-click option
            if progress > 0.9:
                button_y = panel_y + panel_height - 100
                
                draw.rounded_rectangle(
                    [(panel_x + 150, button_y), (panel_x + panel_width - 150, button_y + 50)], 
                    radius=25, fill=HIGHLIGHT_COLOR
                )
                
                draw.text(
                    (panel_x + panel_width//2, button_y + 25), 
                    "One-Click Optimization", 
                    font=regular_font, fill=(255, 255, 255), anchor="mm"
                )
                
                # Explanation text
                draw.text(
                    (panel_x + panel_width//2, button_y + 70), 
                    "For brokers with direct integration, all adjustments can be made automatically", 
                    font=small_font, fill=TEXT_COLOR, anchor="mm"
                )
            
            # Clock showing time progression
            if progress > 0.7:
                clock_x = WIDTH - 200
                clock_y = HEIGHT - 150
                
                # Clock circle
                draw.ellipse([(clock_x - 60, clock_y - 60), (clock_x + 60, clock_y + 60)], outline=TEXT_COLOR, width=2)
                
                # Time label
                draw.text((clock_x, clock_y - 80), "Time", font=regular_font, fill=TEXT_COLOR, anchor="mm")
                
                # Clock hands animation
                minute_progress = min(1.0, (progress - 0.7) / 0.3)  # Animate from 9:15 to 9:30
                
                # Hour hand (pointing near 9)
                angle = np.pi/2 - (9/12) * 2*np.pi
                hour_length = 30
                hx = clock_x + int(hour_length * np.cos(angle))
                hy = clock_y - int(hour_length * np.sin(angle))
                draw.line([(clock_x, clock_y), (hx, hy)], fill=TEXT_COLOR, width=3)
                
                # Minute hand (animating from 15 to 30 minutes)
                minute = 15 + int(minute_progress * 15)
                angle = np.pi/2 - (minute/60) * 2*np.pi
                minute_length = 45
                mx = clock_x + int(minute_length * np.cos(angle))
                my = clock_y - int(minute_length * np.sin(angle))
                draw.line([(clock_x, clock_y), (mx, my)], fill=HIGHLIGHT_COLOR, width=2)
                
                # Show time text
                draw.text((clock_x, clock_y + 80), f"9:{minute} AM", font=regular_font, fill=HIGHLIGHT_COLOR, anchor="mm")
            
            # Narration
            draw.rounded_rectangle(
                [(100, HEIGHT - 100), (WIDTH - 100, HEIGHT - 30)], 
                radius=10, fill=(0, 0, 0, 150)
            )
            
            narration = "By 9:30 AM, Mr. Sharma has freed up ₹12 lakhs of previously locked capital"
            draw.text(
                (WIDTH//2, HEIGHT - 65), 
                narration, 
                font=regular_font, fill=(255, 255, 255), anchor="mm"
            )
            
        elif scene == 5:
            # New Opportunity scene
            progress = min(1.0, (frame_num - 60) / 14)
            
            # Split screen - trading platform on left, results on right
            platform_width = WIDTH // 2 - 50
            
            # Trading platform panel
            platform_x, platform_y = 50, 130
            platform_height = HEIGHT - 250
            
            draw.rounded_rectangle(
                [(platform_x, platform_y), (platform_x + platform_width, platform_y + platform_height)], 
                radius=10, fill=(30, 40, 50), outline=(50, 60, 70)
            )
            
            # Platform header
            draw.rectangle(
                [(platform_x, platform_y), (platform_x + platform_width, platform_y + 40)], 
                fill=(50, 60, 70)
            )
            draw.text(
                (platform_x + platform_width//2, platform_y + 20), 
                "Trading Platform", 
                font=regular_font, fill=(220, 220, 220), anchor="mm"
            )
            
            # Opportunity details
            if progress > 0.2:
                # Stock details section
                details_y = platform_y + 60
                
                draw.text(
                    (platform_x + 20, details_y), 
                    "CIPLA - Cipla Ltd.", 
                    font=regular_font, fill=(220, 220, 220)
                )
                
                # Current price with positive movement
                price_y = details_y + 40
                draw.text(
                    (platform_x + 20, price_y), 
                    "Current Price:", 
                    font=small_font, fill=(180, 180, 180)
                )
                draw.text(
                    (platform_x + 150, price_y), 
                    "₹1,245.60", 
                    font=regular_font, fill=(220, 220, 220)
                )
                draw.text(
                    (platform_x + 250, price_y), 
                    "▲ 3.2%", 
                    font=regular_font, fill=POSITIVE_COLOR
                )
                
                # News alert
                news_y = price_y + 40
                draw.rounded_rectangle(
                    [(platform_x + 20, news_y), (platform_x + platform_width - 20, news_y + 80)], 
                    radius=5, fill=(40, 50, 60)
                )
                draw.text(
                    (platform_x + 35, news_y + 15), 
                    "NEWS: Cipla receives USFDA approval for new drug", 
                    font=small_font, fill=(220, 220, 40)
                )
                draw.text(
                    (platform_x + 35, news_y + 45), 
                    "The pharmaceutical company announced positive\nPhase III trial results for its flagship drug.", 
                    font=small_font, fill=(200, 200, 200)
                )
                
                # Buy order section
                if progress > 0.4:
                    order_y = news_y + 100
                    draw.text(
                        (platform_x + 20, order_y), 
                        "New Position:", 
                        font=regular_font, fill=(220, 220, 220)
                    )
                    
                    # Order details
                    details = [
                        "Symbol: CIPLA JUN FUT",
                        "Quantity: 2000",
                        "Price: ₹1,248.25",
                        "Total Value: ₹24,96,500",
                        f"Margin Required: ₹{int(11.5 * 100000):,}"
                    ]
                    
                    for i, detail in enumerate(details):
                        draw.text(
                            (platform_x + 40, order_y + 35 + i*25), 
                            detail, 
                            font=small_font, fill=(200, 200, 200)
                        )
                    
                    # Buy button (animated based on progress)
                    if progress > 0.6:
                        button_status = "Processing..." if progress < 0.8 else "Order Executed!"
                        button_color = (200, 120, 20) if progress < 0.8 else POSITIVE_COLOR
                        
                        draw.rounded_rectangle(
                            [(platform_x + 100, order_y + 180), (platform_x + platform_width - 100, order_y + 220)], 
                            radius=5, fill=button_color
                        )
                        draw.text(
                            (platform_x + platform_width//2, order_y + 200), 
                            button_status, 
                            font=regular_font, fill=(255, 255, 255), anchor="mm"
                        )
            
            # Results panel (right side)
            results_x = platform_x + platform_width + 50
            results_y = platform_y
            results_width = platform_width
            
            # Only show if progress is far enough
            if progress > 0.7:
                draw.rounded_rectangle(
                    [(results_x, results_y), (results_x + results_width, results_y + platform_height)], 
                    radius=10, fill=(255, 255, 255), outline=HIGHLIGHT_COLOR
                )
                
                # Header
                draw.rectangle(
                    [(results_x, results_y), (results_x + results_width, results_y + 50)], 
                    fill=HIGHLIGHT_COLOR
                )
                
                # End of week results heading
                header_text = "End of Week Results"
                draw.text(
                    (results_x + results_width//2, results_y + 25), 
                    header_text, 
                    font=heading_font, fill=(255, 255, 255), anchor="mm"
                )
                
                # Calendar showing Friday
                cal_y = results_y + 70
                draw.text(
                    (results_x + results_width//2, cal_y), 
                    "Friday, April 12, 2025", 
                    font=regular_font, fill=TEXT_COLOR, anchor="mm"
                )
                
                # Performance chart (simple representation)
                chart_y = cal_y + 50
                chart_height = 120
                
                # Chart background
                draw.rectangle(
                    [(results_x + 40, chart_y), (results_x + results_width - 40, chart_y + chart_height)], 
                    fill=(245, 250, 255), outline=(200, 210, 220)
                )
                
                # Chart grid lines
                for i in range(1, 4):
                    y = chart_y + i * (chart_height // 4)
                    draw.line(
                        [(results_x + 40, y), (results_x + results_width - 40, y)], 
                        fill=(220, 230, 240)
                    )
                
                # Chart data - positive trend line
                points = []
                for i in range(5):  # 5 days (Monday to Friday)
                    x = results_x + 40 + i * ((results_width - 80) // 4)
                    
                    # Create a rising trend with a jump on day 3 (Wednesday)
                    if i < 2:
                        # Slight rise Monday-Tuesday
                        y = chart_y + chart_height - (chart_height * 0.3) - (i * chart_height * 0.05)
                    elif i == 2:
                        # Big jump Wednesday (FDA approval)
                        y = chart_y + chart_height - (chart_height * 0.5)
                    else:
                        # Continued rise Thursday-Friday
                        y = chart_y + chart_height - (chart_height * 0.5) - ((i-2) * chart_height * 0.1)
                    
                    points.append((x, y))
                    
                    # Day markers
                    draw.ellipse([(x-4, y-4), (x+4, y+4)], fill=HIGHLIGHT_COLOR)
                    
                    # Day labels
                    days = ["Mon", "Tue", "Wed", "Thu", "Fri"]
                    draw.text((x, chart_y + chart_height + 15), days[i], font=small_font, fill=TEXT_COLOR, anchor="mm")
                
                # Connect points
                for i in range(len(points)-1):
                    draw.line([points[i], points[i+1]], fill=HIGHLIGHT_COLOR, width=2)
                
                # Fill area under line
                points_fill = points + [(points[-1][0], chart_y + chart_height), (points[0][0], chart_y + chart_height)]
                draw.polygon(points_fill, fill=(13, 110, 253, 50))
                
                # Profit details
                profit_y = chart_y + chart_height + 50
                
                draw.text(
                    (results_x + 50, profit_y), 
                    "CIPLA Position Profit/Loss:", 
                    font=regular_font, fill=TEXT_COLOR
                )
                
                draw.text(
                    (results_x + results_width - 50, profit_y), 
                    "+₹65,000", 
                    font=heading_font, fill=POSITIVE_COLOR, anchor="ra"
                )
                
                # ROI details
                roi_y = profit_y + 50
                
                draw.text(
                    (results_x + 50, roi_y), 
                    "Return on Margin (5 days):", 
                    font=regular_font, fill=TEXT_COLOR
                )
                
                draw.text(
                    (results_x + results_width - 50, roi_y), 
                    "5.65%", 
                    font=heading_font, fill=POSITIVE_COLOR, anchor="ra"
                )
                
                # Note
                note_y = roi_y + 70
                draw.rectangle(
                    [(results_x + 30, note_y), (results_x + results_width - 30, note_y + 60)], 
                    fill=(245, 255, 245), outline=(200, 230, 200)
                )
                
                draw.text(
                    (results_x + results_width//2, note_y + 30), 
                    "This opportunity would not have been possible\nwithout the freed-up margin of ₹12 lakhs", 
                    font=small_font, fill=TEXT_COLOR, anchor="mm"
                )
            
            # Narration
            draw.rounded_rectangle(
                [(100, HEIGHT - 100), (WIDTH - 100, HEIGHT - 30)], 
                radius=10, fill=(0, 0, 0, 150)
            )
            
            narration = "Mr. Sharma's new position generated ₹65,000 profit by the end of the week"
            draw.text(
                (WIDTH//2, HEIGHT - 65), 
                narration, 
                font=regular_font, fill=(255, 255, 255), anchor="mm"
            )
            
        elif scene == 6:
            # Weekly Review scene
            progress = min(1.0, (frame_num - 75) / 14)
            
            # Dashboard panel
            panel_x, panel_y = 80, 120
            panel_width, panel_height = WIDTH - 160, HEIGHT - 220
            
            draw.rounded_rectangle(
                [(panel_x, panel_y), (panel_x + panel_width, panel_y + panel_height)], 
                radius=10, fill=(255, 255, 255), outline=HIGHLIGHT_COLOR
            )
            
            # Panel header
            draw.rectangle(
                [(panel_x, panel_y), (panel_x + panel_width, panel_y + 50)], 
                fill=HIGHLIGHT_COLOR
            )
            draw.text(
                (panel_x + panel_width//2, panel_y + 25), 
                "Optimization History & Performance", 
                font=heading_font, fill=(255, 255, 255), anchor="mm"
            )
            
            # Temporal scope selector
            scope_y = panel_y + 70
            draw.text(
                (panel_x + 30, scope_y), 
                "Time Period:", 
                font=regular_font, fill=TEXT_COLOR
            )
            
            # Time period tabs
            periods = ["Day", "Week", "Month", "Quarter", "Year"]
            tab_width = 100
            tab_x = panel_x + 150
            
            for i, period in enumerate(periods):
                tab_fill = HIGHLIGHT_COLOR if i == 2 else (240, 240, 240)
                tab_text = (255, 255, 255) if i == 2 else TEXT_COLOR
                
                draw.rounded_rectangle(
                    [(tab_x + i*tab_width, scope_y - 10), (tab_x + (i+1)*tab_width - 5, scope_y + 25)], 
                    radius=5, fill=tab_fill
                )
                
                draw.text(
                    (tab_x + i*tab_width + tab_width//2, scope_y + 7), 
                    period, 
                    font=small_font, fill=tab_text, anchor="mm"
                )
            
            # Monthly optimization chart
            if progress > 0.3:
                chart_y = scope_y + 50
                chart_height = 200
                
                # Chart title
                draw.text(
                    (panel_x + panel_width//2, chart_y), 
                    "Capital Freed by AI Margin Optimizer (Last 30 Days)", 
                    font=regular_font, fill=TEXT_COLOR, anchor="mm"
                )
                
                # Chart background
                chart_x = panel_x + 50
                chart_width = panel_width - 100
                
                draw.rectangle(
                    [(chart_x, chart_y + 30), (chart_x + chart_width, chart_y + 30 + chart_height)], 
                    fill=(250, 250, 255), outline=(220, 220, 230)
                )
                
                # Y-axis labels
                for i in range(6):
                    label_y = chart_y + 30 + chart_height - (i * chart_height // 5)
                    value = i * 3  # 0 to 15 lakhs
                    
                    draw.line(
                        [(chart_x, label_y), (chart_x + chart_width, label_y)], 
                        fill=(230, 230, 240)
                    )
                    
                    draw.text(
                        (chart_x - 10, label_y), 
                        f"₹{value}L", 
                        font=small_font, fill=TEXT_COLOR, anchor="ra"
                    )
                
                # X-axis (days)
                for i in range(5):
                    day = i * 7
                    label_x = chart_x + (i * chart_width // 4)
                    
                    draw.text(
                        (label_x, chart_y + 30 + chart_height + 15), 
                        f"Day {day}" if day > 0 else "Start", 
                        font=small_font, fill=TEXT_COLOR, anchor="mm"
                    )
                
                # Bar chart data - capital freed over time
                # Create some realistic-looking data with the current week having higher values
                data = [
                    2.5, 5.8, 3.2, 7.1, 4.3, 3.8, 6.2,  # Week 1
                    5.5, 4.9, 8.3, 6.7, 7.2, 5.8, 9.1,  # Week 2
                    7.3, 6.8, 11.5, 8.4, [12.0, True], 9.3, 10.5,  # Week 3 (current) - tuple for highlight
                    8.2, 7.5, 6.4, 5.9, 10.2, 9.7, 8.8,  # Week 4
                ]
                
                # Draw bars
                bar_width = (chart_width - 30) / 30  # 30 days
                for i, value in enumerate(data):
                    highlight = False
                    if isinstance(value, list):
                        value, highlight = value
                    
                    bar_height = (value / 15) * chart_height
                    bar_x = chart_x + 15 + (i * bar_width)
                    bar_y = chart_y + 30 + chart_height - bar_height
                    
                    bar_color = HIGHLIGHT_COLOR if highlight else (100, 150, 250)
                    
                    draw.rectangle(
                        [(bar_x, bar_y), (bar_x + bar_width - 1, chart_y + 30 + chart_height)], 
                        fill=bar_color
                    )
                
                # Freed capital summary
                summary_y = chart_y + 30 + chart_height + 40
                if progress > 0.6:
                    draw.rounded_rectangle(
                        [(panel_x + 50, summary_y), (panel_x + panel_width - 50, summary_y + 60)], 
                        radius=5, fill=(240, 250, 255), outline=(200, 220, 240)
                    )
                    
                    draw.text(
                        (panel_x + panel_width//2, summary_y + 30), 
                        "Total Capital Freed This Month: ₹42,00,000", 
                        font=heading_font, fill=HIGHLIGHT_COLOR, anchor="mm"
                    )
            
            # ROI calculation
            if progress > 0.8:
                roi_y = panel_y + panel_height - 150
                
                draw.line(
                    [(panel_x + 30, roi_y), (panel_x + panel_width - 30, roi_y)], 
                    fill=(220, 220, 230), width=1
                )
                
                draw.text(
                    (panel_x + panel_width//2, roi_y + 30), 
                    "Return on Investment - AI Margin Optimizer", 
                    font=regular_font, fill=TEXT_COLOR, anchor="mm"
                )
                
                # ROI metrics
                metrics_y = roi_y + 70
                col_width = panel_width // 3
                
                metrics = [
                    ["Additional Profit Generated", "+₹2,10,000"],
                    ["Monthly Subscription Cost", "₹12,000"],
                    ["Return on Investment", "17.5x"]
                ]
                
                for i, (metric, value) in enumerate(metrics):
                    metric_x = panel_x + (i * col_width) + (col_width // 2)
                    
                    draw.text(
                        (metric_x, metrics_y), 
                        metric, 
                        font=small_font, fill=TEXT_COLOR, anchor="mm"
                    )
                    
                    value_color = POSITIVE_COLOR if i != 1 else TEXT_COLOR
                    draw.text(
                        (metric_x, metrics_y + 30), 
                        value, 
                        font=heading_font, fill=value_color, anchor="mm"
                    )
            
            # Narration
            draw.rounded_rectangle(
                [(100, HEIGHT - 100), (WIDTH - 100, HEIGHT - 30)], 
                radius=10, fill=(0, 0, 0, 150)
            )
            
            narration = "Mr. Sharma's monthly review shows a 17.5x return on his investment in the AI tool"
            draw.text(
                (WIDTH//2, HEIGHT - 65), 
                narration, 
                font=regular_font, fill=(255, 255, 255), anchor="mm"
            )
            
        elif scene == 7:
            # Conclusion scene
            progress = min(1.0, (frame_num - 90) / 9)
            
            # Background gradient for conclusion
            for y in range(HEIGHT):
                # Create gradient from top to bottom
                r = int(20 + (y / HEIGHT) * 30)
                g = int(30 + (y / HEIGHT) * 50)
                b = int(70 + (y / HEIGHT) * 20)
                
                draw.line([(0, y), (WIDTH, y)], fill=(r, g, b))
            
            # Title
            draw.text(
                (WIDTH//2, 150), 
                "AI Margin Optimizer", 
                font=title_font, fill=(255, 255, 255), anchor="mm"
            )
            
            draw.text(
                (WIDTH//2, 200), 
                "Your Capital, Unleashed", 
                font=regular_font, fill=(220, 220, 255), anchor="mm"
            )
            
            # Key benefits
            if progress > 0.3:
                benefits_y = 270
                benefit_height = 80
                
                benefits = [
                    "More capital to trade with - without adding new funds",
                    "Simple, actionable recommendations with no technical expertise required",
                    "Measurable improvement in trading performance"
                ]
                
                for i, benefit in enumerate(benefits):
                    # Only show if far enough in the animation
                    if progress > 0.3 + (i * 0.2):
                        benefit_y = benefits_y + (i * benefit_height)
                        
                        # Highlight box
                        alpha = min(1.0, (progress - (0.3 + i * 0.2)) / 0.15)
                        
                        draw.rounded_rectangle(
                            [(WIDTH//2 - 400, benefit_y), (WIDTH//2 + 400, benefit_y + 60)], 
                            radius=10, fill=(255, 255, 255, int(alpha * 200))
                        )
                        
                        # Checkmark
                        check_x = WIDTH//2 - 370
                        draw.text(
                            (check_x, benefit_y + 30), 
                            "✓", 
                            font=heading_font, fill=POSITIVE_COLOR, anchor="mm"
                        )
                        
                        # Benefit text
                        draw.text(
                            (check_x + 30, benefit_y + 30), 
                            benefit, 
                            font=regular_font, fill=TEXT_COLOR
                        )
            
            # Call to action
            if progress > 0.9:
                cta_y = 550
                
                draw.rounded_rectangle(
                    [(WIDTH//2 - 200, cta_y), (WIDTH//2 + 200, cta_y + 60)], 
                    radius=30, fill=HIGHLIGHT_COLOR
                )
                
                draw.text(
                    (WIDTH//2, cta_y + 30), 
                    "Start Your Free Trial Today", 
                    font=heading_font, fill=(255, 255, 255), anchor="mm"
                )
                
                # Contact details
                draw.text(
                    (WIDTH//2, cta_y + 100), 
                    "www.aimarginoptimizer.com | contact@aimarginoptimizer.com | +91 98765 43210", 
                    font=small_font, fill=(220, 220, 255), anchor="mm"
                )
            
            # No narration on conclusion slide
            
        # Progress bar at bottom
        draw.rectangle([(0, HEIGHT - 5), (int(WIDTH * frame_num / total_frames), HEIGHT)], fill=HIGHLIGHT_COLOR)
        
    except Exception as e:
        # If there's an error, at least show it on the image
        draw.text((WIDTH//2, HEIGHT//2), f"Error generating frame: {str(e)}", 
                 font=regular_font, fill=NEGATIVE_COLOR, anchor="mm")
        
    return img

def create_sharma_demo():
    print("Creating Mr. Sharma demo video frames...")
    
    # Create output directory
    create_directory(OUTPUT_DIR)
    
    # Generate frames
    for i in range(NUM_FRAMES):
        print(f"Generating frame {i+1}/{NUM_FRAMES}")
        
        # Generate the frame
        frame = generate_demo_frame(i, NUM_FRAMES)
        
        # Save the frame
        frame.save(f"{OUTPUT_DIR}/frame_{i:04d}.png")
    
    print(f"Demo frames generated in '{OUTPUT_DIR}' directory")
    print(f"Total frames: {NUM_FRAMES}")
    print("To create a video, you can use:")
    print(f"ffmpeg -r 10 -i {OUTPUT_DIR}/frame_%04d.png -c:v libx264 -pix_fmt yuv420p -crf 23 sharma_demo_video.mp4")

if __name__ == "__main__":
    create_sharma_demo()