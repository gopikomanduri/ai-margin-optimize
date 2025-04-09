import time
import os
import sys
from PIL import Image, ImageDraw, ImageFont
import numpy as np
import math

# Configure demo parameters for shorter video
NUM_FRAMES = 200  # 20 seconds at 10fps
OUTPUT_DIR = "shorter_sharma_demo_frames"
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

def draw_businessman(draw, x, y, size=100, expression="happy", action="idle", progress=0):
    """Draw a simple businessman character"""
    # Businessman colors
    suit_color = (40, 60, 80)
    skin_color = (240, 200, 170)
    hair_color = (50, 40, 30)
    
    # Animation effects
    bob_y = int(math.sin(progress * 2 * math.pi) * size * 0.03)
    
    # Draw head
    head_radius = int(size * 0.25)
    draw.ellipse(
        [(x - head_radius, y - head_radius*2 - head_radius + bob_y), 
         (x + head_radius, y - head_radius*2 + head_radius + bob_y)], 
        fill=skin_color, outline=(0, 0, 0)
    )
    
    # Draw hair
    hair_height = int(head_radius * 0.6)
    draw.ellipse(
        [(x - head_radius, y - head_radius*2 - head_radius + bob_y), 
         (x + head_radius, y - head_radius*2 - head_radius + hair_height + bob_y)], 
        fill=hair_color
    )
    
    # Draw face expression
    if expression == "happy":
        # Smile
        draw.arc(
            [(x - head_radius*0.6, y - head_radius*2 - head_radius*0.3 + bob_y), 
             (x + head_radius*0.6, y - head_radius*2 + head_radius*0.3 + bob_y)], 
            start=0, end=180, fill=(0, 0, 0), width=2
        )
    elif expression == "thinking":
        # Thoughtful expression
        draw.arc(
            [(x - head_radius*0.6, y - head_radius*2 + bob_y), 
             (x + head_radius*0.6, y - head_radius*2 + head_radius*0.5 + bob_y)], 
            start=200, end=340, fill=(0, 0, 0), width=2
        )
        # Thought bubble
        bubble_x = x + head_radius + 20
        bubble_y = y - head_radius*2 - 20 + bob_y
        draw.ellipse([(bubble_x, bubble_y), (bubble_x + 15, bubble_y + 15)], fill=(255, 255, 255), outline=(0, 0, 0))
        draw.ellipse([(bubble_x + 10, bubble_y - 20), (bubble_x + 30, bubble_y)], fill=(255, 255, 255), outline=(0, 0, 0))
        draw.ellipse([(bubble_x + 25, bubble_y - 50), (bubble_x + 65, bubble_y - 10)], fill=(255, 255, 255), outline=(0, 0, 0))
    elif expression == "excited":
        # Wide smile and raised eyebrows
        draw.arc(
            [(x - head_radius*0.7, y - head_radius*2 - head_radius*0.2 + bob_y), 
             (x + head_radius*0.7, y - head_radius*2 + head_radius*0.4 + bob_y)], 
            start=0, end=180, fill=(0, 0, 0), width=3
        )
        # Exclamation marks
        draw.text((x + head_radius + 10, y - head_radius*2 + bob_y), "!", font=ImageFont.load_default(), fill=(0, 0, 0))
        draw.text((x + head_radius + 25, y - head_radius*2 + bob_y), "!", font=ImageFont.load_default(), fill=(0, 0, 0))
    else:  # neutral
        # Neutral line
        draw.line(
            [(x - head_radius*0.5, y - head_radius*2 + bob_y), 
             (x + head_radius*0.5, y - head_radius*2 + bob_y)], 
            fill=(0, 0, 0), width=2
        )
    
    # Draw eyes
    eye_y = y - head_radius*2 - head_radius*0.2 + bob_y
    draw.ellipse([(x - head_radius*0.5, eye_y - 5), (x - head_radius*0.2, eye_y + 5)], fill=(255, 255, 255), outline=(0, 0, 0))
    draw.ellipse([(x + head_radius*0.2, eye_y - 5), (x + head_radius*0.5, eye_y + 5)], fill=(255, 255, 255), outline=(0, 0, 0))
    
    # Draw pupils
    pupil_offset = 0
    if expression == "thinking":
        pupil_offset = 2  # Looking slightly upward
    elif action == "pointing":
        pupil_offset = -2  # Looking slightly down
        
    draw.ellipse([(x - head_radius*0.4, eye_y - 3 + pupil_offset), (x - head_radius*0.3, eye_y + 3 + pupil_offset)], fill=(0, 0, 0))
    draw.ellipse([(x + head_radius*0.3, eye_y - 3 + pupil_offset), (x + head_radius*0.4, eye_y + 3 + pupil_offset)], fill=(0, 0, 0))
    
    # Draw body
    body_width = int(size * 0.5)
    body_height = int(size * 0.8)
    
    # Suit
    draw.rectangle(
        [(x - body_width, y - body_height + bob_y), 
         (x + body_width, y + bob_y)], 
        fill=suit_color, outline=(0, 0, 0)
    )
    
    # Shirt collar
    collar_width = int(body_width * 0.5)
    collar_height = int(body_height * 0.3)
    draw.polygon(
        [(x, y - body_height + bob_y), 
         (x - collar_width, y - body_height + collar_height + bob_y),
         (x, y - body_height + collar_height*1.2 + bob_y),
         (x + collar_width, y - body_height + collar_height + bob_y)], 
        fill=(255, 255, 255), outline=(220, 220, 220)
    )
    
    # Tie
    tie_width = int(body_width * 0.15)
    draw.polygon(
        [(x, y - body_height + collar_height*0.8 + bob_y),
         (x - tie_width, y - body_height + collar_height*1.5 + bob_y),
         (x, y - body_height/2 + bob_y),
         (x + tie_width, y - body_height + collar_height*1.5 + bob_y)],
        fill=(180, 40, 40), outline=(160, 30, 30)
    )
    
    # Arms based on action
    arm_width = int(size * 0.15)
    
    if action == "idle":
        # Both arms down
        draw.rectangle(
            [(x - body_width - arm_width, y - body_height*0.8 + bob_y), 
             (x - body_width, y - body_height*0.2 + bob_y)], 
            fill=suit_color, outline=(0, 0, 0)
        )
        draw.rectangle(
            [(x + body_width, y - body_height*0.8 + bob_y), 
             (x + body_width + arm_width, y - body_height*0.2 + bob_y)], 
            fill=suit_color, outline=(0, 0, 0)
        )
    elif action == "pointing":
        # Left arm down, right arm pointing
        draw.rectangle(
            [(x - body_width - arm_width, y - body_height*0.8 + bob_y), 
             (x - body_width, y - body_height*0.2 + bob_y)], 
            fill=suit_color, outline=(0, 0, 0)
        )
        
        # Right arm pointing
        arm_angle = 30 + (20 * math.sin(progress * 2 * math.pi))  # Animate pointing
        arm_length = size * 0.6
        end_x = x + body_width + int(arm_length * math.cos(math.radians(arm_angle)))
        end_y = y - body_height*0.7 + int(arm_length * math.sin(math.radians(arm_angle))) + bob_y
        
        # Draw arm
        draw.line(
            [(x + body_width, y - body_height*0.7 + bob_y), (end_x, end_y)], 
            fill=suit_color, width=arm_width
        )
        
        # Draw hand
        draw.ellipse([(end_x - 10, end_y - 10), (end_x + 10, end_y + 10)], fill=skin_color, outline=(0, 0, 0))
    
    elif action == "thumbsup":
        # Left arm down, right arm thumb up
        draw.rectangle(
            [(x - body_width - arm_width, y - body_height*0.8 + bob_y), 
             (x - body_width, y - body_height*0.2 + bob_y)], 
            fill=suit_color, outline=(0, 0, 0)
        )
        
        # Right arm up with thumb
        arm_y = y - body_height*0.5 + bob_y
        draw.rectangle(
            [(x + body_width, arm_y), 
             (x + body_width + arm_width*2, arm_y - body_height*0.4)], 
            fill=suit_color, outline=(0, 0, 0)
        )
        
        # Thumb
        thumb_x = x + body_width + arm_width*2
        thumb_y = arm_y - body_height*0.4
        draw.rectangle(
            [(thumb_x - arm_width*0.3, thumb_y - arm_width), 
             (thumb_x + arm_width*0.3, thumb_y)], 
            fill=skin_color, outline=(0, 0, 0)
        )
    
    elif action == "phone":
        # Left arm down, right arm holding phone
        draw.rectangle(
            [(x - body_width - arm_width, y - body_height*0.8 + bob_y), 
             (x - body_width, y - body_height*0.2 + bob_y)], 
            fill=suit_color, outline=(0, 0, 0)
        )
        
        # Right arm bent to hold phone
        phone_y = y - body_height*0.3 + bob_y
        draw.rectangle(
            [(x + body_width, y - body_height*0.8 + bob_y), 
             (x + body_width + arm_width, phone_y)], 
            fill=suit_color, outline=(0, 0, 0)
        )
        
        # Phone
        phone_width = int(size * 0.15)
        phone_height = int(size * 0.3)
        draw.rectangle(
            [(x + body_width - phone_width, phone_y - phone_height), 
             (x + body_width + phone_width, phone_y)], 
            fill=(30, 30, 30), outline=(0, 0, 0)
        )
        
        # Phone screen
        screen_margin = int(phone_width * 0.1)
        draw.rectangle(
            [(x + body_width - phone_width + screen_margin, phone_y - phone_height + screen_margin), 
             (x + body_width + phone_width - screen_margin, phone_y - screen_margin)], 
            fill=(200, 220, 255)
        )
        
        # Hand holding phone
        draw.ellipse(
            [(x + body_width - phone_width - 10, phone_y - 10), 
             (x + body_width - phone_width + 10, phone_y + 10)], 
            fill=skin_color, outline=(0, 0, 0)
        )
    
    elif action == "tablet":
        # Arms holding tablet
        tablet_y = y - body_height*0.3 + bob_y
        tablet_width = int(size * 0.7)
        tablet_height = int(size * 0.5)
        
        # Left arm
        draw.rectangle(
            [(x - body_width - arm_width, y - body_height*0.8 + bob_y), 
             (x - body_width, tablet_y)], 
            fill=suit_color, outline=(0, 0, 0)
        )
        
        # Right arm
        draw.rectangle(
            [(x + body_width, y - body_height*0.8 + bob_y), 
             (x + body_width + arm_width, tablet_y)], 
            fill=suit_color, outline=(0, 0, 0)
        )
        
        # Tablet
        draw.rectangle(
            [(x - tablet_width/2, tablet_y - tablet_height), 
             (x + tablet_width/2, tablet_y)], 
            fill=(30, 30, 30), outline=(0, 0, 0)
        )
        
        # Tablet screen
        screen_margin = int(tablet_width * 0.05)
        draw.rectangle(
            [(x - tablet_width/2 + screen_margin, tablet_y - tablet_height + screen_margin), 
             (x + tablet_width/2 - screen_margin, tablet_y - screen_margin)], 
            fill=(200, 220, 255)
        )
        
        # Hands holding tablet
        draw.ellipse(
            [(x - tablet_width/2 - 5, tablet_y - 10), 
             (x - tablet_width/2 + 15, tablet_y + 10)], 
            fill=skin_color, outline=(0, 0, 0)
        )
        draw.ellipse(
            [(x + tablet_width/2 - 15, tablet_y - 10), 
             (x + tablet_width/2 + 5, tablet_y + 10)], 
            fill=skin_color, outline=(0, 0, 0)
        )
    
    # Draw legs
    leg_width = int(size * 0.18)
    leg_height = int(size * 0.6)
    draw.rectangle(
        [(x - body_width + leg_width, y + bob_y), 
         (x - leg_width, y + leg_height + bob_y)], 
        fill=suit_color, outline=(0, 0, 0)
    )
    draw.rectangle(
        [(x + leg_width, y + bob_y), 
         (x + body_width - leg_width, y + leg_height + bob_y)], 
        fill=suit_color, outline=(0, 0, 0)
    )
    
    # Draw feet
    foot_width = int(size * 0.25)
    foot_height = int(size * 0.1)
    draw.ellipse(
        [(x - body_width + leg_width - foot_width/2, y + leg_height + bob_y - foot_height/2), 
         (x - leg_width + foot_width/2, y + leg_height + bob_y + foot_height/2)], 
        fill=(0, 0, 0)
    )
    draw.ellipse(
        [(x + leg_width - foot_width/2, y + leg_height + bob_y - foot_height/2), 
         (x + body_width - leg_width + foot_width/2, y + leg_height + bob_y + foot_height/2)], 
        fill=(0, 0, 0)
    )

def draw_dashboard_element(draw, x, y, width, height, title, value, subtitle=None, highlight=False, progress=1.0):
    """Draw a dashboard card element with optional highlight"""
    # Card outline
    border_color = HIGHLIGHT_COLOR if highlight else (220, 220, 230)
    bg_color = (250, 253, 255) if highlight else (255, 255, 255)
    
    draw.rounded_rectangle(
        [(x, y), (x + width, y + height)],
        radius=10, fill=bg_color, outline=border_color, width=2
    )
    
    try:
        # Try to load fonts
        title_font = ImageFont.truetype("arial.ttf", 16)
        value_font = ImageFont.truetype("arial.ttf", 22)
        subtitle_font = ImageFont.truetype("arial.ttf", 14)
    except IOError:
        # Fall back to default font
        title_font = ImageFont.load_default()
        value_font = ImageFont.load_default()
        subtitle_font = ImageFont.load_default()
    
    # Title
    draw.text(
        (x + 15, y + 20),
        title,
        font=title_font, fill=TEXT_COLOR
    )
    
    # Value
    value_y = y + 50
    draw.text(
        (x + 15, value_y),
        value,
        font=value_font, fill=TEXT_COLOR
    )
    
    # Optional subtitle
    if subtitle:
        draw.text(
            (x + 15, value_y + 35),
            subtitle,
            font=subtitle_font, fill=NEUTRAL_COLOR
        )

def draw_confidence_meter(draw, x, y, width, height, confidence, progress=1.0):
    """Draw an AI confidence meter with animation"""
    # Background
    draw.rounded_rectangle(
        [(x, y), (x + width, y + height)],
        radius=10, fill=(255, 255, 255), outline=(220, 220, 230), width=1
    )
    
    try:
        # Try to load fonts
        title_font = ImageFont.truetype("arial.ttf", 16)
        value_font = ImageFont.truetype("arial.ttf", 18)
    except IOError:
        # Fall back to default font
        title_font = ImageFont.load_default()
        value_font = ImageFont.load_default()
    
    # Title
    draw.text(
        (x + width//2, y + 20),
        "AI Confidence",
        font=title_font, fill=TEXT_COLOR, anchor="mm"
    )
    
    # Confidence bar
    bar_width = width - 40
    bar_height = 20
    bar_x = x + 20
    bar_y = y + 50
    
    # Bar background
    draw.rounded_rectangle(
        [(bar_x, bar_y), (bar_x + bar_width, bar_y + bar_height)],
        radius=bar_height//2, fill=(240, 240, 240)
    )
    
    # Animate confidence fill
    fill_progress = min(1.0, progress * 2)
    animated_confidence = confidence * fill_progress
    fill_width = int(bar_width * animated_confidence)
    
    if fill_width > 0:
        # Determine color based on confidence level
        if animated_confidence < 0.5:
            fill_color = (220, 53, 69)  # Low confidence - red
        elif animated_confidence < 0.7:
            fill_color = (255, 193, 7)  # Medium confidence - yellow
        else:
            fill_color = (25, 135, 84)  # High confidence - green
        
        draw.rounded_rectangle(
            [(bar_x, bar_y), (bar_x + fill_width, bar_y + bar_height)],
            radius=bar_height//2, fill=fill_color
        )
    
    # Confidence percentage
    if progress > 0.9:
        draw.text(
            (x + width//2, bar_y + bar_height + 20),
            f"{int(confidence * 100)}% Confident",
            font=value_font, fill=TEXT_COLOR, anchor="mm"
        )

def generate_demo_frame(frame_num, total_frames):
    """Generate a single frame for the shorter Mr. Sharma demo video"""
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
        # For a shorter video, use 5 scenes with 40 frames each
        scene = 1
        if frame_num < 40:  # 0-4 seconds
            scene = 1  # Introduction & Login
        elif frame_num < 80:  # 4-8 seconds
            scene = 2  # Dashboard Overview
        elif frame_num < 120:  # 8-12 seconds
            scene = 3  # Taking Action - Freeing Up Capital
        elif frame_num < 160:  # 12-16 seconds
            scene = 4  # New Opportunity & Results
        else:  # 16-20 seconds
            scene = 5  # Conclusion & Benefits
        
        # Calculate scene-specific progress (0-1)
        scene_progress = (frame_num - (scene - 1) * 40) / 40
        
        # Draw header with logo
        draw.rectangle([(0, 0), (WIDTH, 70)], fill=(20, 30, 70))
        draw_text_with_shadow(draw, "AI Margin Optimizer", (30, 15), title_font, (255, 255, 255))
        
        # Scene title and progress
        scene_titles = {
            1: "Introduction - Meet Mr. Sharma",
            2: "Dashboard Overview - Morning Check",
            3: "Taking Action - Freeing Up Capital",
            4: "New Opportunity & Weekly Results",
            5: "Benefits - Capital Unleashed"
        }
        draw.rectangle([(0, 70), (WIDTH, 110)], fill=(240, 240, 255))
        draw.text((WIDTH//2, 90), scene_titles[scene], font=heading_font, fill=(20, 30, 70), anchor="mm")
        
        # Draw narration at bottom
        narrations = {
            1: "Mr. Sharma logs into the AI Margin Optimizer app for his daily morning check.",
            2: "The dashboard immediately shows potential margin optimization of ₹12 lakhs.",
            3: "Following the simple steps, he adjusts his margin with his broker.",
            4: "With newly freed capital, Mr. Sharma earns ₹65,000 from a new position.",
            5: "Mr. Sharma consistently benefits from optimized margin requirements."
        }
        
        draw.rounded_rectangle(
            [(100, HEIGHT - 100), (WIDTH - 100, HEIGHT - 30)], 
            radius=10, fill=(0, 0, 0, 150)
        )
        
        draw.text(
            (WIDTH//2, HEIGHT - 65), 
            narrations[scene], 
            font=regular_font, fill=(255, 255, 255), anchor="mm"
        )
        
        # Draw scene content based on the current scene
        if scene == 1:
            # Introduction & Login scene
            # Draw Mr. Sharma character
            character_progress = min(1.0, scene_progress * 2)  # 0-0.5 seconds
            if character_progress < 1:
                # Character entering animation
                x_pos = int(WIDTH//4 - 200 + (character_progress * 200))
                draw_businessman(draw, x_pos, HEIGHT//2, size=150, expression="happy", action="idle", progress=scene_progress)
            else:
                # Character using phone animation
                draw_businessman(draw, WIDTH//4, HEIGHT//2, size=150, expression="happy", action="phone", progress=scene_progress)
            
            # Mr. Sharma info
            if scene_progress > 0.4:
                info_x = 120
                info_y = HEIGHT//2 - 220
                
                draw.rounded_rectangle(
                    [(info_x, info_y), (info_x + 300, info_y + 180)], 
                    radius=10, fill=(255, 255, 255, 200), outline=(220, 220, 230)
                )
                
                draw.text(
                    (info_x + 150, info_y + 30), 
                    "Mr. Sharma", 
                    font=heading_font, fill=TEXT_COLOR, anchor="mm"
                )
                
                details = [
                    "• F&O Trader for 7 years",
                    "• Portfolio Value: ₹1.5 crore",
                    "• Typical Positions: 8-12",
                    "• Trading Approach: Swing",
                ]
                
                for i, detail in enumerate(details):
                    draw.text(
                        (info_x + 20, info_y + 70 + i*25), 
                        detail, 
                        font=regular_font, fill=TEXT_COLOR
                    )
            
            # Login screen on right side (simplified)
            if scene_progress > 0.6:
                login_x = WIDTH//2 + 50
                login_y = HEIGHT//2 - 200
                login_width = 350
                login_height = 400
                
                # Screen outline
                draw.rounded_rectangle(
                    [(login_x, login_y), (login_x + login_width, login_y + login_height)],
                    radius=20, fill=(255, 255, 255), outline=HIGHLIGHT_COLOR, width=2
                )
                
                # Header
                draw.rectangle(
                    [(login_x, login_y), (login_x + login_width, login_y + 60)],
                    fill=HIGHLIGHT_COLOR
                )
                
                # App title
                draw.text(
                    (login_x + login_width//2, login_y + 30),
                    "AI Margin Optimizer",
                    font=regular_font, fill=(255, 255, 255), anchor="mm"
                )
                
                # Welcome text
                welcome_y = login_y + 100
                draw.text(
                    (login_x + login_width//2, welcome_y),
                    "Welcome",
                    font=heading_font, fill=TEXT_COLOR, anchor="mm"
                )
                
                draw.text(
                    (login_x + login_width//2, welcome_y + 40),
                    "Select your broker to continue",
                    font=regular_font, fill=TEXT_COLOR, anchor="mm"
                )
                
                # Broker logos (simplified)
                logo_y = welcome_y + 100
                logo_size = 60
                logo_gap = 30
                
                for i in range(6):
                    row = i // 3
                    col = i % 3
                    
                    logo_x = login_x + 50 + col * (logo_size + logo_gap)
                    logo_y_pos = logo_y + row * (logo_size + logo_gap)
                    
                    # Logo colors
                    logo_colors = [
                        (47, 115, 187),  # Zerodha blue
                        (227, 82, 5),    # ICICI orange
                        (13, 110, 253),  # Angel blue
                        (57, 123, 33),   # HDFC green
                        (244, 67, 54),   # Upstox red
                        (255, 193, 7),   # Motilal yellow
                    ]
                    
                    # Highlight first logo (Zerodha)
                    highlight = (i == 0)
                    
                    draw.rounded_rectangle(
                        [(logo_x, logo_y_pos), (logo_x + logo_size, logo_y_pos + logo_size)],
                        radius=10, fill=logo_colors[i], 
                        outline=HIGHLIGHT_COLOR if highlight else (200, 200, 200),
                        width=3 if highlight else 1
                    )
                
                # Connect button
                if scene_progress > 0.8:
                    button_width = 200
                    button_y = logo_y + 170
                    
                    button_color = POSITIVE_COLOR if scene_progress > 0.9 else HIGHLIGHT_COLOR
                    button_text = "Connected!" if scene_progress > 0.9 else "Connect to Broker"
                    
                    draw.rounded_rectangle(
                        [(login_x + (login_width - button_width) // 2, button_y), 
                         (login_x + (login_width + button_width) // 2, button_y + 50)],
                        radius=25, fill=button_color
                    )
                    
                    draw.text(
                        (login_x + login_width//2, button_y + 25),
                        button_text,
                        font=regular_font, fill=(255, 255, 255), anchor="mm"
                    )
            
        elif scene == 2:
            # Dashboard Overview scene
            # Draw main dashboard layout
            dashboard_x = 80
            dashboard_y = 130
            dashboard_width = WIDTH - 160
            dashboard_height = HEIGHT - 250
            
            # Dashboard background
            draw.rounded_rectangle(
                [(dashboard_x, dashboard_y), (dashboard_x + dashboard_width, dashboard_y + dashboard_height)],
                radius=10, fill=(250, 250, 255), outline=(220, 220, 230), width=1
            )
            
            # Dashboard header
            draw.text(
                (dashboard_x + 20, dashboard_y + 20),
                "Tuesday, April 9, 2025 | 9:15 AM",
                font=regular_font, fill=TEXT_COLOR
            )
            
            # Account summary section
            # Animation progress for each dashboard element
            card_progress = min(1.0, scene_progress * 2)
            
            # Portfolio card
            card_width = 280
            card_height = 120
            card_x = dashboard_x + 30
            card_y = dashboard_y + 60
            
            draw_dashboard_element(
                draw, card_x, card_y, card_width, card_height,
                "Portfolio Value", "₹1,50,00,000",
                subtitle="Last updated: Today, 9:00 AM",
                progress=card_progress
            )
            
            # Current Margin card (highlighted)
            card_x = card_x + card_width + 30
            
            draw_dashboard_element(
                draw, card_x, card_y, card_width, card_height,
                "Current Margin", "₹42,00,000",
                subtitle="Last updated: Today, 9:00 AM",
                highlight=True,
                progress=card_progress
            )
            
            # Optimized Margin card
            card_x = card_x + card_width + 30
            
            draw_dashboard_element(
                draw, card_x, card_y, card_width, card_height,
                "Optimized Margin", "₹30,00,000",
                subtitle="Potential Savings: ₹12,00,000",
                highlight=True,
                progress=card_progress
            )
            
            # AI Confidence meter
            confidence_x = dashboard_x + 30
            confidence_y = card_y + card_height + 30
            confidence_width = card_width
            confidence_height = 100
            
            # Only show if far enough in the animation
            if card_progress > 0.5:
                draw_confidence_meter(
                    draw, confidence_x, confidence_y, confidence_width, confidence_height,
                    confidence=0.85, progress=(card_progress - 0.5) * 2
                )
            
            # News section
            news_x = confidence_x + confidence_width + 30
            news_y = confidence_y
            news_width = dashboard_width - confidence_width - 60
            news_height = 100
            
            # News section header
            if card_progress > 0.6:
                draw.text(
                    (news_x, news_y),
                    "Recent Market News",
                    font=heading_font, fill=TEXT_COLOR
                )
                
                # News item
                if card_progress > 0.7:
                    news_item_y = news_y + 40
                    
                    # News item card
                    draw.rounded_rectangle(
                        [(news_x, news_item_y), (news_x + news_width, news_item_y + news_height)],
                        radius=8, fill=(255, 255, 255), outline=(220, 220, 230), width=1
                    )
                    
                    # Positive sentiment indicator
                    draw.rectangle(
                        [(news_x, news_item_y), (news_x + 8, news_item_y + news_height)],
                        fill=POSITIVE_COLOR
                    )
                    
                    # News title and summary
                    draw.text(
                        (news_x + 20, news_item_y + 20),
                        "RELIANCE: Q1 Results Beat Expectations",
                        font=regular_font, fill=TEXT_COLOR
                    )
                    
                    draw.text(
                        (news_x + 20, news_item_y + 50),
                        "Reliance Industries reported 15% higher profits than analyst consensus.",
                        font=small_font, fill=(80, 80, 80)
                    )
                    
                    # Sentiment label
                    draw.text(
                        (news_x + news_width - 20, news_item_y + 20),
                        "Positive impact",
                        font=small_font, fill=POSITIVE_COLOR, anchor="ra"
                    )
            
            # Action buttons
            if card_progress > 0.8:
                button_y = dashboard_y + dashboard_height - 80
                button_width = 200
                button_height = 50
                button_gap = 30
                
                # "View Details" button - highlighted
                button_x = dashboard_x + dashboard_width//2 - button_width - button_gap//2
                
                draw.rounded_rectangle(
                    [(button_x, button_y), (button_x + button_width, button_y + button_height)],
                    radius=25, fill=HIGHLIGHT_COLOR
                )
                
                draw.text(
                    (button_x + button_width//2, button_y + button_height//2),
                    "View Details",
                    font=regular_font, fill=(255, 255, 255), anchor="mm"
                )
                
                # "Review Later" button
                button_x = dashboard_x + dashboard_width//2 + button_gap//2
                
                draw.rounded_rectangle(
                    [(button_x, button_y), (button_x + button_width, button_y + button_height)],
                    radius=25, fill=(240, 240, 240)
                )
                
                draw.text(
                    (button_x + button_width//2, button_y + button_height//2),
                    "Review Later",
                    font=regular_font, fill=TEXT_COLOR, anchor="mm"
                )
            
            # Mr. Sharma checking his phone animation
            if scene_progress > 0.7:
                # Draw small character at bottom right
                draw_businessman(
                    draw, WIDTH - 100, HEIGHT - 150, 
                    size=100, expression="happy", action="phone", 
                    progress=scene_progress
                )
            
        elif scene == 3:
            # Taking Action scene
            # Draw action steps screen
            steps_x = 100
            steps_y = 130
            steps_width = WIDTH - 200
            steps_height = HEIGHT - 250
            
            # Steps background
            draw.rounded_rectangle(
                [(steps_x, steps_y), (steps_x + steps_width, steps_y + steps_height)],
                radius=10, fill=(255, 255, 255), outline=HIGHLIGHT_COLOR, width=2
            )
            
            # Header
            draw.rectangle(
                [(steps_x, steps_y), (steps_x + steps_width, steps_y + 50)],
                fill=HIGHLIGHT_COLOR
            )
            
            draw.text(
                (steps_x + steps_width//2, steps_y + 25),
                "Action Steps - Zerodha Kite",
                font=heading_font, fill=(255, 255, 255), anchor="mm"
            )
            
            # Steps with animated appearance
            step_y = steps_y + 70
            
            steps = [
                "1. Navigate to Margins section in Zerodha Kite",
                "2. Update margin values for these positions:",
                "   • RELIANCE JUN FUT: Reduce from ₹4,25,000 to ₹3,40,000",
                "   • HDFCBANK JUN FUT: Reduce from ₹3,80,000 to ₹2,85,000",
                "   • NIFTY 19500 CALL: Reduce from ₹2,50,000 to ₹1,80,000",
                "3. Confirm adjustments by clicking 'Update Margins'"
            ]
            
            for i, step in enumerate(steps):
                # Only show step if it's time in the animation
                if scene_progress > (i * 0.15):
                    step_alpha = min(1.0, (scene_progress - (i * 0.15)) / 0.1)
                    
                    if i == 1:  # Add extra space before position details
                        step_y += 10
                    
                    # Highlight the current step being explained
                    if i == int(scene_progress / 0.15) and scene_progress < 0.9:
                        highlight_rect = [
                            (steps_x + 20, step_y - 5),
                            (steps_x + steps_width - 20, step_y + 25)
                        ]
                        draw.rectangle(highlight_rect, fill=(255, 255, 200))
                    
                    draw.text(
                        (steps_x + 40, step_y), 
                        step, 
                        font=regular_font, fill=TEXT_COLOR
                    )
                    
                    step_y += 35
            
            # One-click option
            if scene_progress > 0.9:
                button_y = steps_y + steps_height - 100
                
                draw.rounded_rectangle(
                    [(steps_x + 150, button_y), (steps_x + steps_width - 150, button_y + 50)], 
                    radius=25, fill=HIGHLIGHT_COLOR
                )
                
                draw.text(
                    (steps_x + steps_width//2, button_y + 25), 
                    "One-Click Optimization", 
                    font=regular_font, fill=(255, 255, 255), anchor="mm"
                )
                
                # Explanation text
                draw.text(
                    (steps_x + steps_width//2, button_y + 70), 
                    "For brokers with direct integration, all adjustments can be made automatically", 
                    font=small_font, fill=TEXT_COLOR, anchor="mm"
                )
            
            # Clock showing time progression
            if scene_progress > 0.7:
                clock_x = WIDTH - 200
                clock_y = HEIGHT - 160
                
                # Clock circle
                draw.ellipse([(clock_x - 60, clock_y - 60), (clock_x + 60, clock_y + 60)], outline=TEXT_COLOR, width=2)
                
                # Clock hands animation
                minute_progress = min(1.0, (scene_progress - 0.7) / 0.3)  # Animate from 9:15 to 9:30
                
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
            
            # Mr. Sharma taking action
            if scene_progress > 0.3:
                draw_businessman(
                    draw, 200, HEIGHT - 160, 
                    size=120, expression="excited" if scene_progress > 0.8 else "thinking", 
                    action="phone", 
                    progress=scene_progress
                )
                
                # Show freed capital callout if near end of scene
                if scene_progress > 0.8:
                    callout_x = 350
                    callout_y = HEIGHT - 250
                    
                    draw.rounded_rectangle(
                        [(callout_x, callout_y), (callout_x + 300, callout_y + 100)],
                        radius=10, fill=POSITIVE_COLOR, outline=(20, 110, 60), width=2
                    )
                    
                    draw.text(
                        (callout_x + 150, callout_y + 30),
                        "Capital Freed!",
                        font=heading_font, fill=(255, 255, 255), anchor="mm"
                    )
                    
                    draw.text(
                        (callout_x + 150, callout_y + 70),
                        "₹12,00,000",
                        font=title_font, fill=(255, 255, 255), anchor="mm"
                    )
            
        elif scene == 4:
            # New Opportunity & Results scene
            # Split screen - trading on left, results on right
            split_x = WIDTH // 2
            
            # Left side - New opportunity
            left_x = 80
            left_y = 130
            left_width = split_x - 100
            left_height = HEIGHT - 250
            
            # Trading panel
            draw.rounded_rectangle(
                [(left_x, left_y), (left_x + left_width, left_y + left_height)],
                radius=10, fill=(30, 40, 50), outline=(50, 60, 70)
            )
            
            # Panel header
            draw.rectangle(
                [(left_x, left_y), (left_x + left_width, left_y + 40)],
                fill=(50, 60, 70)
            )
            
            draw.text(
                (left_x + left_width//2, left_y + 20),
                "New Trading Opportunity",
                font=regular_font, fill=(220, 220, 220), anchor="mm"
            )
            
            # Stock details (only if far enough in animation)
            if scene_progress > 0.3:
                details_y = left_y + 60
                
                draw.text(
                    (left_x + 20, details_y),
                    "CIPLA - Cipla Ltd.",
                    font=regular_font, fill=(220, 220, 220)
                )
                
                # Current price with positive movement
                price_y = details_y + 40
                draw.text(
                    (left_x + 20, price_y),
                    "Current Price:",
                    font=small_font, fill=(180, 180, 180)
                )
                
                draw.text(
                    (left_x + 150, price_y),
                    "₹1,245.60",
                    font=regular_font, fill=(220, 220, 220)
                )
                
                draw.text(
                    (left_x + 250, price_y),
                    "▲ 3.2%",
                    font=regular_font, fill=POSITIVE_COLOR
                )
                
                # News alert
                news_y = price_y + 40
                draw.rounded_rectangle(
                    [(left_x + 20, news_y), (left_x + left_width - 20, news_y + 60)],
                    radius=5, fill=(40, 50, 60)
                )
                
                draw.text(
                    (left_x + 35, news_y + 15),
                    "NEWS: Cipla receives USFDA approval for new drug",
                    font=small_font, fill=(220, 220, 40)
                )
                
                draw.text(
                    (left_x + 35, news_y + 40),
                    "Phase III trial results positive",
                    font=small_font, fill=(200, 200, 200)
                )
            
            # Buy order animation
            if scene_progress > 0.5:
                order_y = left_y + 230
                
                draw.text(
                    (left_x + 20, order_y),
                    "New Position with Freed Capital:",
                    font=regular_font, fill=(220, 220, 220)
                )
                
                # Order details
                details = [
                    "Symbol: CIPLA JUN FUT",
                    "Quantity: 2000",
                    "Margin Required: ₹11,50,000"
                ]
                
                for i, detail in enumerate(details):
                    draw.text(
                        (left_x + 40, order_y + 40 + i*30),
                        detail,
                        font=small_font, fill=(200, 200, 200)
                    )
                
                # Buy button animation
                if scene_progress > 0.7:
                    button_status = "Processing..." if scene_progress < 0.85 else "Order Executed!"
                    button_color = (200, 120, 20) if scene_progress < 0.85 else POSITIVE_COLOR
                    
                    draw.rounded_rectangle(
                        [(left_x + 50, order_y + left_height - 80), 
                         (left_x + left_width - 50, order_y + left_height - 40)],
                        radius=5, fill=button_color
                    )
                    
                    draw.text(
                        (left_x + left_width//2, order_y + left_height - 60),
                        button_status,
                        font=regular_font, fill=(255, 255, 255), anchor="mm"
                    )
            
            # Right side - Results (only show if far enough in animation)
            right_x = split_x + 20
            right_y = left_y
            right_width = left_width
            right_height = left_height
            
            if scene_progress > 0.6:
                # Results panel
                draw.rounded_rectangle(
                    [(right_x, right_y), (right_x + right_width, right_y + right_height)],
                    radius=10, fill=(255, 255, 255), outline=HIGHLIGHT_COLOR, width=2
                )
                
                # Panel header
                draw.rectangle(
                    [(right_x, right_y), (right_x + right_width, right_y + 50)],
                    fill=HIGHLIGHT_COLOR
                )
                
                draw.text(
                    (right_x + right_width//2, right_y + 25),
                    "End of Week Results",
                    font=heading_font, fill=(255, 255, 255), anchor="mm"
                )
                
                # Week info
                week_y = right_y + 70
                
                draw.text(
                    (right_x + right_width//2, week_y),
                    "Friday, April 12, 2025",
                    font=regular_font, fill=TEXT_COLOR, anchor="mm"
                )
                
                # Profit results
                if scene_progress > 0.7:
                    profit_y = week_y + 50
                    
                    draw.text(
                        (right_x + 30, profit_y),
                        "CIPLA Position Profit/Loss:",
                        font=regular_font, fill=TEXT_COLOR
                    )
                    
                    # Animate profit growth
                    profit_progress = min(1.0, (scene_progress - 0.7) / 0.3)
                    profit_value = int(65000 * profit_progress)
                    
                    draw.text(
                        (right_x + right_width - 30, profit_y),
                        f"+₹{profit_value:,}",
                        font=heading_font, fill=POSITIVE_COLOR, anchor="ra"
                    )
                    
                    # Return on margin
                    roi_y = profit_y + 60
                    
                    draw.text(
                        (right_x + 30, roi_y),
                        "Return on Margin (4 days):",
                        font=regular_font, fill=TEXT_COLOR
                    )
                    
                    roi_value = 5.65 * profit_progress
                    
                    draw.text(
                        (right_x + right_width - 30, roi_y),
                        f"{roi_value:.2f}%",
                        font=heading_font, fill=POSITIVE_COLOR, anchor="ra"
                    )
                    
                    # Callout box
                    if scene_progress > 0.9:
                        callout_y = roi_y + 80
                        
                        draw.rounded_rectangle(
                            [(right_x + 20, callout_y), (right_x + right_width - 20, callout_y + 80)],
                            radius=10, fill=(240, 255, 240), outline=POSITIVE_COLOR
                        )
                        
                        draw.text(
                            (right_x + right_width//2, callout_y + 40),
                            "This opportunity was only possible\ndue to freed-up margin!",
                            font=regular_font, fill=TEXT_COLOR, anchor="mm"
                        )
            
            # Mr. Sharma character
            if scene_progress > 0.8:
                draw_businessman(
                    draw, WIDTH - 150, HEIGHT - 160,
                    size=120, expression="excited", action="thumbsup",
                    progress=scene_progress
                )
            
        elif scene == 5:
            # Conclusion & Benefits scene
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
            
            # Mr. Sharma showing benefits
            if scene_progress > 0.3:
                draw_businessman(
                    draw, WIDTH//4, HEIGHT//2 + 100,
                    size=150, expression="happy", action="pointing",
                    progress=scene_progress
                )
            
            # Key benefits
            benefits_y = 270
            benefit_height = 80
            
            benefits = [
                "More capital to trade with - without adding new funds",
                "Simple, actionable recommendations with no technical expertise required",
                "Measurable improvement in trading performance"
            ]
            
            for i, benefit in enumerate(benefits):
                # Only show if far enough in the animation
                if scene_progress > 0.2 + (i * 0.2):
                    benefit_y = benefits_y + (i * benefit_height)
                    
                    # Highlight box
                    alpha = min(1.0, (scene_progress - (0.2 + i * 0.2)) / 0.15)
                    
                    draw.rounded_rectangle(
                        [(WIDTH//2 - 100, benefit_y), (WIDTH - 100, benefit_y + 60)],
                        radius=10, fill=(255, 255, 255, int(alpha * 200))
                    )
                    
                    # Checkmark
                    check_x = WIDTH//2 - 70
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
            
            # ROI summary
            if scene_progress > 0.8:
                roi_y = benefits_y + 3 * benefit_height + 40
                
                draw.rounded_rectangle(
                    [(WIDTH//2, roi_y), (WIDTH - 100, roi_y + 80)],
                    radius=10, fill=(255, 255, 255, 180)
                )
                
                draw.text(
                    (WIDTH//2 + 20, roi_y + 20),
                    "Monthly Subscription: ₹12,000",
                    font=regular_font, fill=TEXT_COLOR
                )
                
                draw.text(
                    (WIDTH//2 + 20, roi_y + 50),
                    "Return on Investment: 17.5x",
                    font=heading_font, fill=POSITIVE_COLOR
                )
            
            # Call to action
            if scene_progress > 0.9:
                cta_y = roi_y + 100
                
                draw.rounded_rectangle(
                    [(WIDTH//2, cta_y), (WIDTH - 100, cta_y + 60)],
                    radius=30, fill=HIGHLIGHT_COLOR
                )
                
                draw.text(
                    (WIDTH//2 + (WIDTH - 100 - WIDTH//2)//2, cta_y + 30),
                    "Start Your Free Trial Today",
                    font=heading_font, fill=(255, 255, 255), anchor="mm"
                )
        
        # Progress bar at bottom
        draw.rectangle([(0, HEIGHT - 5), (int(WIDTH * frame_num / total_frames), HEIGHT)], fill=HIGHLIGHT_COLOR)
        
    except Exception as e:
        # If there's an error, at least show it on the image
        draw.text((WIDTH//2, HEIGHT//2), f"Error generating frame: {str(e)}", 
                 font=regular_font, fill=NEGATIVE_COLOR, anchor="mm")
        
    return img

def create_sharma_demo():
    print("Creating shorter Mr. Sharma demo video frames...")
    
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
    print(f"ffmpeg -r 10 -i {OUTPUT_DIR}/frame_%04d.png -c:v libx264 -pix_fmt yuv420p -crf 23 shorter_sharma_demo_video.mp4")

if __name__ == "__main__":
    create_sharma_demo()