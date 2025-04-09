import time
import os
import sys
from PIL import Image, ImageDraw, ImageFont
import numpy as np
import math
import random

# Configure demo parameters
NUM_FRAMES = 600  # 60 seconds at 10fps
OUTPUT_DIR = "detailed_sharma_demo_frames"
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
    """Draw a simple businessman character
    
    Args:
        draw: ImageDraw object
        x, y: Center position of the character
        size: Size scale
        expression: "happy", "thinking", "excited", "neutral"
        action: "idle", "pointing", "thumbsup", "phone", "tablet"
        progress: Animation progress (0-1)
    """
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

def draw_app_login(draw, x, y, width, height, progress):
    """Draw a login screen for the app with animation"""
    # Screen outline
    draw.rounded_rectangle(
        [(x, y), (x + width, y + height)],
        radius=20, fill=(255, 255, 255), outline=HIGHLIGHT_COLOR, width=2
    )
    
    # Header
    draw.rectangle(
        [(x, y), (x + width, y + 60)],
        fill=HIGHLIGHT_COLOR
    )
    
    try:
        # Try to load fonts
        title_font = ImageFont.truetype("arial.ttf", 24)
        regular_font = ImageFont.truetype("arial.ttf", 18)
        small_font = ImageFont.truetype("arial.ttf", 14)
    except IOError:
        # Fall back to default font
        title_font = ImageFont.load_default()
        regular_font = ImageFont.load_default()
        small_font = ImageFont.load_default()
    
    # App title
    draw.text(
        (x + width//2, y + 30),
        "AI Margin Optimizer",
        font=title_font, fill=(255, 255, 255), anchor="mm"
    )
    
    # Welcome text
    welcome_y = y + 100
    draw.text(
        (x + width//2, welcome_y),
        "Welcome",
        font=title_font, fill=TEXT_COLOR, anchor="mm"
    )
    
    draw.text(
        (x + width//2, welcome_y + 40),
        "Please select your broker to continue",
        font=regular_font, fill=TEXT_COLOR, anchor="mm"
    )
    
    # Broker logos grid
    logo_size = 80
    logo_gap = 20
    logo_cols = 3
    grid_width = (logo_size * logo_cols) + (logo_gap * (logo_cols - 1))
    start_x = x + (width - grid_width) // 2
    start_y = welcome_y + 90
    
    broker_names = ["Zerodha", "ICICI Direct", "Angel One", "HDFC Sec", "Upstox", "Motilal"]
    
    for i, broker in enumerate(broker_names):
        row = i // logo_cols
        col = i % logo_cols
        
        logo_x = start_x + col * (logo_size + logo_gap)
        logo_y = start_y + row * (logo_size + logo_gap)
        
        # Draw broker logo (simplified as colored rectangles with letters)
        logo_color = [
            (47, 115, 187),  # Zerodha blue
            (227, 82, 5),    # ICICI orange
            (13, 110, 253),  # Angel blue
            (57, 123, 33),   # HDFC green
            (244, 67, 54),   # Upstox red
            (255, 193, 7),   # Motilal yellow
        ][i]
        
        # Highlight Zerodha (selected broker)
        border = 3 if i == 0 and progress > 0.5 else 1
        border_color = HIGHLIGHT_COLOR if i == 0 and progress > 0.5 else (200, 200, 200)
        
        draw.rounded_rectangle(
            [(logo_x, logo_y), (logo_x + logo_size, logo_y + logo_size)],
            radius=10, fill=logo_color, outline=border_color, width=border
        )
        
        # First letter of broker as logo
        draw.text(
            (logo_x + logo_size//2, logo_y + logo_size//2),
            broker[0],
            font=title_font, fill=(255, 255, 255), anchor="mm"
        )
        
        # Broker name
        draw.text(
            (logo_x + logo_size//2, logo_y + logo_size + 15),
            broker,
            font=small_font, fill=TEXT_COLOR, anchor="mm"
        )
    
    # Login button animation
    if progress > 0.7:
        button_width = 200
        button_y = start_y + (2 * (logo_size + logo_gap)) + 60
        
        button_color = HIGHLIGHT_COLOR if progress < 0.9 else POSITIVE_COLOR
        button_text = "Connect to Broker" if progress < 0.9 else "Connected!"
        
        draw.rounded_rectangle(
            [(x + (width - button_width) // 2, button_y), 
             (x + (width + button_width) // 2, button_y + 50)],
            radius=25, fill=button_color
        )
        
        draw.text(
            (x + width//2, button_y + 25),
            button_text,
            font=regular_font, fill=(255, 255, 255), anchor="mm"
        )

def draw_broker_auth_screen(draw, x, y, width, height, progress):
    """Draw a broker authorization screen with animation"""
    # Screen outline
    draw.rounded_rectangle(
        [(x, y), (x + width, y + height)],
        radius=20, fill=(255, 255, 255), outline=(200, 200, 200), width=2
    )
    
    try:
        # Try to load fonts
        title_font = ImageFont.truetype("arial.ttf", 22)
        regular_font = ImageFont.truetype("arial.ttf", 16)
        small_font = ImageFont.truetype("arial.ttf", 14)
    except IOError:
        # Fall back to default font
        title_font = ImageFont.load_default()
        regular_font = ImageFont.load_default()
        small_font = ImageFont.load_default()
    
    # Zerodha header
    draw.rectangle(
        [(x, y), (x + width, y + 60)],
        fill=(47, 115, 187)  # Zerodha blue
    )
    
    # Zerodha logo text
    draw.text(
        (x + 30, y + 30),
        "Zerodha",
        font=title_font, fill=(255, 255, 255), anchor="lm"
    )
    
    # Authentication form
    form_y = y + 90
    
    # Title
    draw.text(
        (x + width//2, form_y),
        "Authorize AI Margin Optimizer",
        font=title_font, fill=TEXT_COLOR, anchor="mm"
    )
    
    # Description
    description = "This app is requesting permission to:"
    draw.text(
        (x + 50, form_y + 50),
        description,
        font=regular_font, fill=TEXT_COLOR
    )
    
    # Permissions list
    permissions = [
        "✓ View your portfolio holdings",
        "✓ View your margin information",
        "✓ View your account balance"
    ]
    
    for i, permission in enumerate(permissions):
        # Only show permission if it's time in the animation
        if progress > 0.3 + (i * 0.1):
            perm_y = form_y + 90 + (i * 30)
            
            draw.text(
                (x + 70, perm_y),
                permission,
                font=regular_font, fill=TEXT_COLOR
            )
    
    # Security note
    if progress > 0.6:
        note_y = form_y + 190
        
        draw.rounded_rectangle(
            [(x + 50, note_y), (x + width - 50, note_y + 70)],
            radius=10, fill=(255, 250, 230), outline=(230, 210, 180)
        )
        
        draw.text(
            (x + 70, note_y + 20),
            "🔒 This app will NOT be able to place trades or withdraw funds.",
            font=small_font, fill=TEXT_COLOR
        )
        
        draw.text(
            (x + 70, note_y + 45),
            "All data is encrypted and secure.",
            font=small_font, fill=TEXT_COLOR
        )
    
    # Authentication buttons
    if progress > 0.7:
        button_y = form_y + 290
        button_width = 150
        
        # Deny button
        draw.rounded_rectangle(
            [(x + width//2 - button_width - 20, button_y), 
             (x + width//2 - 20, button_y + 50)],
            radius=25, fill=(220, 220, 220)
        )
        
        draw.text(
            (x + width//2 - button_width//2 - 20, button_y + 25),
            "Deny",
            font=regular_font, fill=TEXT_COLOR, anchor="mm"
        )
        
        # Allow button (animated)
        button_color = (50, 170, 100) if progress > 0.9 else (80, 150, 80)
        
        draw.rounded_rectangle(
            [(x + width//2 + 20, button_y), 
             (x + width//2 + button_width + 20, button_y + 50)],
            radius=25, fill=button_color
        )
        
        draw.text(
            (x + width//2 + button_width//2 + 20, button_y + 25),
            "Allow",
            font=regular_font, fill=(255, 255, 255), anchor="mm"
        )

def draw_dashboard_element(draw, x, y, width, height, title, value, subtitle=None, highlight=False, highlight_text=None, progress=1.0):
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
    
    # Fade in animation
    alpha = min(1.0, progress * 2)
    text_color = TEXT_COLOR
    
    # Title
    draw.text(
        (x + 15, y + 20),
        title,
        font=title_font, fill=text_color
    )
    
    # Value
    value_y = y + 50
    draw.text(
        (x + 15, value_y),
        value,
        font=value_font, fill=text_color
    )
    
    # Optional subtitle
    if subtitle:
        draw.text(
            (x + 15, value_y + 35),
            subtitle,
            font=subtitle_font, fill=NEUTRAL_COLOR
        )
    
    # Optional highlight notification
    if highlight and highlight_text and progress > 0.7:
        highlight_y = y + height - 35
        
        draw.rounded_rectangle(
            [(x + 10, highlight_y), (x + width - 10, highlight_y + 25)],
            radius=5, fill=(255, 240, 200)
        )
        
        draw.text(
            (x + width//2, highlight_y + 12),
            highlight_text,
            font=subtitle_font, fill=TEXT_COLOR, anchor="mm"
        )

def draw_confidence_meter(draw, x, y, width, height, confidence, title="AI Confidence", progress=1.0):
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
        subtitle_font = ImageFont.truetype("arial.ttf", 14)
    except IOError:
        # Fall back to default font
        title_font = ImageFont.load_default()
        value_font = ImageFont.load_default()
        subtitle_font = ImageFont.load_default()
    
    # Title
    draw.text(
        (x + width//2, y + 20),
        title,
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

def draw_news_item(draw, x, y, width, title, summary, sentiment="neutral", progress=1.0):
    """Draw a news item with animated appearance"""
    height = 100
    
    # Fade in animation
    alpha = min(1.0, progress * 2)
    
    # Background with sentiment color indicator
    if sentiment == "positive":
        sentiment_color = POSITIVE_COLOR
    elif sentiment == "negative":
        sentiment_color = NEGATIVE_COLOR
    else:
        sentiment_color = NEUTRAL_COLOR
    
    # News item card
    draw.rounded_rectangle(
        [(x, y), (x + width, y + height)],
        radius=8, fill=(255, 255, 255), outline=(220, 220, 230), width=1
    )
    
    # Sentiment indicator
    draw.rectangle(
        [(x, y), (x + 8, y + height)],
        fill=sentiment_color
    )
    
    try:
        # Try to load fonts
        title_font = ImageFont.truetype("arial.ttf", 16)
        summary_font = ImageFont.truetype("arial.ttf", 14)
        sentiment_font = ImageFont.truetype("arial.ttf", 12)
    except IOError:
        # Fall back to default font
        title_font = ImageFont.load_default()
        summary_font = ImageFont.load_default()
        sentiment_font = ImageFont.load_default()
    
    # News title
    draw.text(
        (x + 20, y + 20),
        title,
        font=title_font, fill=TEXT_COLOR
    )
    
    # Summary (truncated to fit)
    max_chars = 80
    if len(summary) > max_chars:
        summary = summary[:max_chars-3] + "..."
    
    draw.text(
        (x + 20, y + 50),
        summary,
        font=summary_font, fill=(80, 80, 80)
    )
    
    # Sentiment label
    sentiment_text = f"{sentiment.capitalize()} impact"
    draw.text(
        (x + width - 20, y + 20),
        sentiment_text,
        font=sentiment_font, fill=sentiment_color, anchor="ra"
    )

def draw_optimization_factors(draw, x, y, width, height, factors, progress=1.0):
    """Draw optimization factors with animated appearance"""
    # Background
    draw.rounded_rectangle(
        [(x, y), (x + width, y + height)],
        radius=10, fill=(255, 255, 255), outline=(220, 220, 230), width=1
    )
    
    try:
        # Try to load fonts
        title_font = ImageFont.truetype("arial.ttf", 18)
        factor_font = ImageFont.truetype("arial.ttf", 16)
        detail_font = ImageFont.truetype("arial.ttf", 14)
    except IOError:
        # Fall back to default font
        title_font = ImageFont.load_default()
        factor_font = ImageFont.load_default()
        detail_font = ImageFont.load_default()
    
    # Title
    draw.text(
        (x + width//2, y + 20),
        "Optimization Factors",
        font=title_font, fill=TEXT_COLOR, anchor="mm"
    )
    
    # Factors list with animated appearance
    for i, (factor, value, detail) in enumerate(factors):
        # Only show factor if it's time in the animation
        if progress > (i * 0.2):
            factor_alpha = min(1.0, (progress - (i * 0.2)) / 0.15)
            factor_y = y + 60 + (i * 70)
            
            # Factor background
            bg_color = (250, 255, 250) if value > 0 else (255, 250, 250)
            draw.rectangle(
                [(x + 20, factor_y), (x + width - 20, factor_y + 60)],
                fill=bg_color, outline=(240, 240, 240), width=1
            )
            
            # Factor icon and text
            icon = "+" if value > 0 else "-"
            icon_color = POSITIVE_COLOR if value > 0 else NEGATIVE_COLOR
            
            draw.text(
                (x + 40, factor_y + 15),
                icon,
                font=title_font, fill=icon_color
            )
            
            draw.text(
                (x + 70, factor_y + 15),
                factor,
                font=factor_font, fill=TEXT_COLOR
            )
            
            draw.text(
                (x + 70, factor_y + 40),
                detail,
                font=detail_font, fill=(100, 100, 100)
            )
            
            # Impact value
            value_text = f"{abs(value)}% {'Reduction' if value > 0 else 'Increase'}"
            value_color = POSITIVE_COLOR if value > 0 else NEGATIVE_COLOR
            
            draw.text(
                (x + width - 40, factor_y + 30),
                value_text,
                font=factor_font, fill=value_color, anchor="rm"
            )

def draw_step_instructions(draw, x, y, width, height, steps, progress=1.0):
    """Draw step-by-step instructions with animation"""
    # Background
    draw.rounded_rectangle(
        [(x, y), (x + width, y + height)],
        radius=10, fill=(255, 255, 255), outline=HIGHLIGHT_COLOR, width=2
    )
    
    # Header
    draw.rectangle(
        [(x, y), (x + width, y + 50)],
        fill=HIGHLIGHT_COLOR
    )
    
    try:
        # Try to load fonts
        header_font = ImageFont.truetype("arial.ttf", 20)
        step_font = ImageFont.truetype("arial.ttf", 16)
        detail_font = ImageFont.truetype("arial.ttf", 14)
    except IOError:
        # Fall back to default font
        header_font = ImageFont.load_default()
        step_font = ImageFont.load_default()
        detail_font = ImageFont.load_default()
    
    # Header text
    draw.text(
        (x + width//2, y + 25),
        "Action Steps - Zerodha Kite",
        font=header_font, fill=(255, 255, 255), anchor="mm"
    )
    
    # Steps with animated appearance
    for i, (step_num, step_text, details) in enumerate(steps):
        # Only show step if it's time in the animation
        if progress > (i * 0.15):
            step_alpha = min(1.0, (progress - (i * 0.15)) / 0.1)
            step_y = y + 70 + (i * (80 if details else 50))
            
            # Highlight current step
            if i == int(progress / 0.15) and progress < 0.9:
                highlight_rect = [
                    (x + 20, step_y - 5),
                    (x + width - 20, step_y + (45 if details else 25))
                ]
                draw.rectangle(highlight_rect, fill=(255, 255, 200))
            
            # Step number and text
            draw.text(
                (x + 40, step_y),
                f"{step_num}. {step_text}",
                font=step_font, fill=TEXT_COLOR
            )
            
            # Optional step details
            if details:
                detail_y = step_y + 30
                for j, detail in enumerate(details):
                    draw.text(
                        (x + 60, detail_y + j*20),
                        detail,
                        font=detail_font, fill=(100, 100, 100)
                    )
    
    # Success checkmark or button
    if progress > 0.9:
        check_y = y + height - 70
        
        draw.rounded_rectangle(
            [(x + width//2 - 100, check_y), (x + width//2 + 100, check_y + 50)],
            radius=25, fill=POSITIVE_COLOR
        )
        
        draw.text(
            (x + width//2, check_y + 25),
            "✓ Completed",
            font=step_font, fill=(255, 255, 255), anchor="mm"
        )

def generate_demo_frame(frame_num, total_frames):
    """Generate a single frame for the detailed Mr. Sharma demo video"""
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
        if frame_num < 60:  # 0-6 seconds
            scene = 1  # Introduction & Login
        elif frame_num < 120:  # 6-12 seconds
            scene = 2  # Broker Authorization
        elif frame_num < 180:  # 12-18 seconds
            scene = 3  # Dashboard Overview
        elif frame_num < 240:  # 18-24 seconds
            scene = 4  # Understanding the Recommendation
        elif frame_num < 300:  # 24-30 seconds
            scene = 5  # Taking Action
        elif frame_num < 360:  # 30-36 seconds
            scene = 6  # New Opportunity
        elif frame_num < 420:  # 36-42 seconds
            scene = 7  # End of Week Results
        elif frame_num < 480:  # 42-48 seconds
            scene = 8  # Weekly Performance Review
        elif frame_num < 540:  # 48-54 seconds
            scene = 9  # Monthly ROI Calculation
        else:  # 54-60 seconds
            scene = 10  # Conclusion & Benefits
        
        # Calculate scene-specific progress (0-1)
        scene_progress = (frame_num - (scene - 1) * 60) / 60
        
        # Draw header with logo
        draw.rectangle([(0, 0), (WIDTH, 70)], fill=(20, 30, 70))
        draw_text_with_shadow(draw, "AI Margin Optimizer", (30, 15), title_font, (255, 255, 255))
        
        # Scene title and progress
        scene_titles = {
            1: "Introduction - Meet Mr. Sharma",
            2: "Broker Authorization - Secure Connection",
            3: "Dashboard Overview - Morning Check",
            4: "Understanding the Recommendation",
            5: "Taking Action - Freeing Up Capital",
            6: "New Opportunity - Putting Capital to Work",
            7: "End of Week Results",
            8: "Weekly Performance Review",
            9: "Monthly ROI Calculation",
            10: "Benefits - Capital Unleashed"
        }
        draw.rectangle([(0, 70), (WIDTH, 110)], fill=(240, 240, 255))
        draw.text((WIDTH//2, 90), scene_titles[scene], font=heading_font, fill=(20, 30, 70), anchor="mm")
        
        # Draw narration at bottom
        narrations = {
            1: "Mr. Sharma logs into the AI Margin Optimizer app for his daily morning check.",
            2: "The app securely connects to his Zerodha trading account with read-only access.",
            3: "The dashboard immediately shows potential margin optimization of ₹12 lakhs.",
            4: "Mr. Sharma reviews why this optimization is possible based on multiple factors.",
            5: "Following the simple steps, he adjusts his margin with his broker.",
            6: "With newly freed capital, Mr. Sharma identifies a promising opportunity.",
            7: "By Friday, his new position using freed-up capital generates ₹65,000 profit.",
            8: "The weekly review shows consistent capital efficiency improvements.",
            9: "Monthly analysis confirms a 17.5x return on his subscription investment.",
            10: "Mr. Sharma consistently benefits from optimized margin requirements."
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
            
            # Show login screen on the right side
            login_progress = max(0, min(1.0, (scene_progress - 0.3) * 1.4))  # Start at 0.3 seconds
            if login_progress > 0:
                login_x = WIDTH//2 + 50
                login_y = HEIGHT//2 - 200
                login_width = 350
                login_height = 400
                
                draw_app_login(draw, login_x, login_y, login_width, login_height, login_progress)
            
            # Mr. Sharma info
            if scene_progress > 0.6:
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
            
        elif scene == 2:
            # Broker Authorization scene
            # Draw Mr. Sharma character using phone
            draw_businessman(draw, WIDTH//4, HEIGHT//2, size=150, expression="thinking", action="phone", progress=scene_progress)
            
            # Authorization screen on the right
            auth_x = WIDTH//2 + 50
            auth_y = HEIGHT//2 - 200
            auth_width = 350
            auth_height = 400
            
            draw_broker_auth_screen(draw, auth_x, auth_y, auth_width, auth_height, scene_progress)
            
            # Security info near character
            if scene_progress > 0.5:
                info_x = 100
                info_y = HEIGHT//2 - 220
                
                draw.rounded_rectangle(
                    [(info_x, info_y), (info_x + 320, info_y + 150)], 
                    radius=10, fill=(255, 255, 255, 200), outline=HIGHLIGHT_COLOR
                )
                
                draw.text(
                    (info_x + 160, info_y + 30), 
                    "Secure Connection", 
                    font=heading_font, fill=TEXT_COLOR, anchor="mm"
                )
                
                security_points = [
                    "• Read-only access",
                    "• Bank-level encryption",
                    "• No trading permissions",
                    "• Revokable anytime"
                ]
                
                for i, point in enumerate(security_points):
                    draw.text(
                        (info_x + 20, info_y + 70 + i*20), 
                        point, 
                        font=small_font, fill=TEXT_COLOR
                    )
            
        elif scene == 3:
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
                highlight_text="Optimization available!",
                progress=card_progress
            )
            
            # Optimized Margin card
            card_x = card_x + card_width + 30
            
            draw_dashboard_element(
                draw, card_x, card_y, card_width, card_height,
                "Optimized Margin", "₹30,00,000",
                subtitle="Potential Savings: ₹12,00,000",
                highlight=True,
                highlight_text="85% Confidence",
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
            news_height = dashboard_height - (card_height + 30) - 150
            
            # News section header
            if card_progress > 0.6:
                draw.text(
                    (news_x, news_y),
                    "Recent Market News",
                    font=heading_font, fill=TEXT_COLOR
                )
                
                # News items
                news_items = [
                    {
                        "title": "RELIANCE: Q1 Results Beat Expectations",
                        "summary": "Reliance Industries reported 15% higher profits than analyst consensus.",
                        "sentiment": "positive"
                    },
                    {
                        "title": "RBI Maintains Interest Rate in Policy Meeting",
                        "summary": "The central bank kept repo rate unchanged at 6.5%, in line with expectations.",
                        "sentiment": "neutral"
                    },
                    {
                        "title": "Banking Sector Volatility Decreases to 2-Month Low",
                        "summary": "HDFC Bank and peers show stabilizing price movements after recent turbulence.",
                        "sentiment": "positive"
                    }
                ]
                
                for i, news in enumerate(news_items):
                    # Only show news if it's time in the animation
                    if card_progress > 0.6 + (i * 0.1):
                        news_item_y = news_y + 40 + (i * 110)
                        
                        draw_news_item(
                            draw, news_x, news_item_y, news_width,
                            news["title"], news["summary"], news["sentiment"],
                            progress=(card_progress - 0.6 - (i * 0.1)) * 10
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
            
        elif scene == 4:
            # Understanding the Recommendation scene
            # Draw recommendation detail screen
            detail_x = 80
            detail_y = 130
            detail_width = WIDTH - 160
            detail_height = HEIGHT - 250
            
            # Screen background
            draw.rounded_rectangle(
                [(detail_x, detail_y), (detail_x + detail_width, detail_y + detail_height)],
                radius=10, fill=(255, 255, 255), outline=HIGHLIGHT_COLOR, width=2
            )
            
            # Screen header
            draw.rectangle(
                [(detail_x, detail_y), (detail_x + detail_width, detail_y + 50)],
                fill=HIGHLIGHT_COLOR
            )
            
            draw.text(
                (detail_x + detail_width//2, detail_y + 25),
                "Margin Optimization Details",
                font=heading_font, fill=(255, 255, 255), anchor="mm"
            )
            
            # Current vs Optimized summary
            summary_y = detail_y + 70
            
            draw.text(
                (detail_x + 50, summary_y),
                "Current Margin:",
                font=regular_font, fill=TEXT_COLOR
            )
            
            draw.text(
                (detail_x + 350, summary_y),
                "₹42,00,000",
                font=heading_font, fill=TEXT_COLOR
            )
            
            draw.text(
                (detail_x + 50, summary_y + 40),
                "Optimized Margin:",
                font=regular_font, fill=TEXT_COLOR
            )
            
            draw.text(
                (detail_x + 350, summary_y + 40),
                "₹30,00,000",
                font=heading_font, fill=POSITIVE_COLOR
            )
            
            draw.text(
                (detail_x + 50, summary_y + 80),
                "Potential Savings:",
                font=regular_font, fill=TEXT_COLOR
            )
            
            draw.text(
                (detail_x + 350, summary_y + 80),
                "₹12,00,000",
                font=heading_font, fill=POSITIVE_COLOR
            )
            
            # Divider
            draw.line(
                [(detail_x + 20, summary_y + 130), (detail_x + detail_width - 20, summary_y + 130)],
                fill=(220, 220, 230), width=1
            )
            
            # Optimization factors
            factors_y = summary_y + 150
            factors_x = detail_x + 30
            factors_width = detail_width//2 - 60
            factors_height = 300
            
            # Only show if far enough in the animation
            if scene_progress > 0.3:
                optimization_factors = [
                    ("News Sentiment", 5.2, "Positive news for RELIANCE and HDFC"),
                    ("Market Correlation", 3.8, "Decreased correlation between positions"),
                    ("Sector Volatility", 4.5, "Banking sector volatility stabilized")
                ]
                
                draw_optimization_factors(
                    draw, factors_x, factors_y, factors_width, factors_height,
                    optimization_factors, progress=(scene_progress - 0.3) * 1.5
                )
            
            # Factor visualization on right side
            if scene_progress > 0.5:
                visual_x = factors_x + factors_width + 30
                visual_y = factors_y
                visual_width = factors_width
                visual_height = factors_height
                
                # Background for visualization
                draw.rounded_rectangle(
                    [(visual_x, visual_y), (visual_x + visual_width, visual_y + visual_height)],
                    radius=10, fill=(255, 255, 255), outline=(220, 220, 230), width=1
                )
                
                # Title
                draw.text(
                    (visual_x + visual_width//2, visual_y + 20),
                    "Optimization Factors",
                    font=regular_font, fill=TEXT_COLOR, anchor="mm"
                )
                
                # Radar chart visualization
                chart_x = visual_x + visual_width//2
                chart_y = visual_y + visual_height//2
                chart_radius = min(visual_width, visual_height)//2 - 40
                
                # Draw chart axes
                for angle in range(0, 360, 72):  # 5 axes at 72 degrees each
                    rad = np.radians(angle)
                    end_x = chart_x + int(chart_radius * np.cos(rad))
                    end_y = chart_y + int(chart_radius * np.sin(rad))
                    draw.line([(chart_x, chart_y), (end_x, end_y)], fill=(200, 200, 200), width=1)
                
                # Draw circular guidelines
                for r in range(chart_radius//3, chart_radius+1, chart_radius//3):
                    draw.ellipse(
                        [(chart_x - r, chart_y - r), (chart_x + r, chart_y + r)], 
                        outline=(200, 200, 200)
                    )
                
                # Factor values (scale 0-1)
                factor_values = [0.8, 0.9, 0.75, 0.65, 0.85]  # Market, News, Volatility, Correlation, Macro
                factor_names = ["Market", "News", "Volatility", "Correlation", "Macro"]
                
                # Animate the drawing of the radar chart
                progress_factor = min(1.0, (scene_progress - 0.5) * 2)
                animated_values = [v * progress_factor for v in factor_values]
                
                # Draw data points and connect them
                points = []
                for i, value in enumerate(animated_values):
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
                if len(points) > 2:
                    points.append(points[0])  # Close the shape
                    draw.polygon(points, fill=(13, 110, 253, 100), outline=HIGHLIGHT_COLOR)
            
            # Mr. Sharma reviewing with thinking expression
            if scene_progress > 0.7:
                draw_businessman(
                    draw, 150, HEIGHT - 150, 
                    size=100, expression="thinking", action="tablet", 
                    progress=scene_progress
                )
            
        elif scene == 5:
            # Taking Action scene
            # Draw action steps screen
            steps_x = 100
            steps_y = 130
            steps_width = WIDTH - 200
            steps_height = HEIGHT - 250
            
            # Steps with animation based on progress
            steps = [
                (1, "Navigate to Margins section in Zerodha Kite", None),
                (2, "Update margin values for these positions:", [
                    "• RELIANCE JUN FUT: Reduce from ₹4,25,000 to ₹3,40,000",
                    "• HDFCBANK JUN FUT: Reduce from ₹3,80,000 to ₹2,85,000",
                    "• NIFTY 19500 CALL: Reduce from ₹2,50,000 to ₹1,80,000"
                ]),
                (3, "Confirm adjustments by clicking 'Update Margins'", None),
                (4, "Verify new margin requirement is updated", None)
            ]
            
            draw_step_instructions(draw, steps_x, steps_y, steps_width, steps_height, steps, scene_progress)
            
            # Clock showing time progression
            if scene_progress > 0.6:
                clock_x = WIDTH - 150
                clock_y = HEIGHT - 200
                
                # Clock circle
                draw.ellipse([(clock_x - 60, clock_y - 60), (clock_x + 60, clock_y + 60)], outline=TEXT_COLOR, width=2)
                
                # Time label
                draw.text((clock_x, clock_y - 80), "Time", font=regular_font, fill=TEXT_COLOR, anchor="mm")
                
                # Clock hands animation
                minute_progress = min(1.0, (scene_progress - 0.6) / 0.4)  # Animate from 9:15 to 9:30
                
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
            
        elif scene == 6:
            # New Opportunity scene
            # Split screen - trading platform on left, opportunity details on right
            platform_x = 80
            platform_y = 130
            platform_width = WIDTH//2 - 100
            platform_height = HEIGHT - 250
            
            # Trading platform panel
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
            
            # Stock details
            if scene_progress > 0.2:
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
                if scene_progress > 0.4:
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
                        f"Total Value: ₹{int(1248.25 * 2000):,}",
                        f"Margin Required: ₹{int(11.5 * 100000):,}"
                    ]
                    
                    for i, detail in enumerate(details):
                        draw.text(
                            (platform_x + 40, order_y + 35 + i*25),
                            detail,
                            font=small_font, fill=(200, 200, 200)
                        )
                    
                    # Buy button animation
                    if scene_progress > 0.6:
                        button_status = "Processing..." if scene_progress < 0.8 else "Order Executed!"
                        button_color = (200, 120, 20) if scene_progress < 0.8 else POSITIVE_COLOR
                        
                        draw.rounded_rectangle(
                            [(platform_x + 100, order_y + 180), (platform_x + platform_width - 100, order_y + 220)],
                            radius=5, fill=button_color
                        )
                        
                        draw.text(
                            (platform_x + platform_width//2, order_y + 200),
                            button_status,
                            font=regular_font, fill=(255, 255, 255), anchor="mm"
                        )
            
            # Opportunity details on right
            opportunity_x = platform_x + platform_width + 40
            opportunity_y = platform_y
            opportunity_width = platform_width
            opportunity_height = platform_height
            
            if scene_progress > 0.5:
                # Background
                draw.rounded_rectangle(
                    [(opportunity_x, opportunity_y), (opportunity_x + opportunity_width, opportunity_y + opportunity_height)],
                    radius=10, fill=(255, 255, 255), outline=HIGHLIGHT_COLOR, width=2
                )
                
                # Header
                draw.rectangle(
                    [(opportunity_x, opportunity_y), (opportunity_x + opportunity_width, opportunity_y + 50)],
                    fill=HIGHLIGHT_COLOR
                )
                
                draw.text(
                    (opportunity_x + opportunity_width//2, opportunity_y + 25),
                    "Opportunity Analysis",
                    font=heading_font, fill=(255, 255, 255), anchor="mm"
                )
                
                # Financial details
                details_y = opportunity_y + 70
                
                # Source of capital
                draw.text(
                    (opportunity_x + 20, details_y),
                    "Source of Capital:",
                    font=regular_font, fill=TEXT_COLOR
                )
                
                draw.text(
                    (opportunity_x + opportunity_width - 20, details_y),
                    "Margin Optimization",
                    font=regular_font, fill=HIGHLIGHT_COLOR, anchor="ra"
                )
                
                # Capital available
                draw.text(
                    (opportunity_x + 20, details_y + 40),
                    "Capital Available:",
                    font=regular_font, fill=TEXT_COLOR
                )
                
                draw.text(
                    (opportunity_x + opportunity_width - 20, details_y + 40),
                    "₹12,00,000",
                    font=regular_font, fill=POSITIVE_COLOR, anchor="ra"
                )
                
                # Opportunity details
                if scene_progress > 0.7:
                    analysis_y = details_y + 90
                    
                    draw.text(
                        (opportunity_x + opportunity_width//2, analysis_y),
                        "Opportunity Details",
                        font=regular_font, fill=TEXT_COLOR, anchor="mm"
                    )
                    
                    # Reasons to enter trade
                    reasons_y = analysis_y + 40
                    
                    reasons = [
                        "• FDA approval for key drug (positive catalyst)",
                        "• Technical breakout above resistance",
                        "• Sector rotation into pharmaceuticals",
                        "• Low implied volatility relative to historical"
                    ]
                    
                    for i, reason in enumerate(reasons):
                        draw.text(
                            (opportunity_x + 30, reasons_y + i*25),
                            reason,
                            font=small_font, fill=TEXT_COLOR
                        )
                    
                    # Expected return
                    return_y = reasons_y + len(reasons)*25 + 30
                    
                    draw.text(
                        (opportunity_x + 20, return_y),
                        "Expected Return:",
                        font=regular_font, fill=TEXT_COLOR
                    )
                    
                    draw.text(
                        (opportunity_x + opportunity_width - 20, return_y),
                        "+4-6% (5 days)",
                        font=regular_font, fill=POSITIVE_COLOR, anchor="ra"
                    )
                    
                    # Risk
                    draw.text(
                        (opportunity_x + 20, return_y + 40),
                        "Risk Level:",
                        font=regular_font, fill=TEXT_COLOR
                    )
                    
                    draw.text(
                        (opportunity_x + opportunity_width - 20, return_y + 40),
                        "Medium",
                        font=regular_font, fill=HIGHLIGHT_COLOR, anchor="ra"
                    )
            
            # Mr. Sharma excited about opportunity
            if scene_progress > 0.7:
                draw_businessman(
                    draw, WIDTH//2, HEIGHT - 160,
                    size=120, expression="excited", action="pointing",
                    progress=scene_progress
                )
            
        elif scene == 7:
            # End of Week Results scene
            # Week calendar with profit results
            calendar_x = 100
            calendar_y = 130
            calendar_width = WIDTH - 200
            calendar_height = HEIGHT - 300
            
            # Calendar background
            draw.rounded_rectangle(
                [(calendar_x, calendar_y), (calendar_x + calendar_width, calendar_y + calendar_height)],
                radius=10, fill=(255, 255, 255), outline=(220, 220, 230), width=2
            )
            
            # Header
            draw.rectangle(
                [(calendar_x, calendar_y), (calendar_x + calendar_width, calendar_y + 50)],
                fill=HIGHLIGHT_COLOR
            )
            
            draw.text(
                (calendar_x + calendar_width//2, calendar_y + 25),
                "Week of April 8-12, 2025",
                font=heading_font, fill=(255, 255, 255), anchor="mm"
            )
            
            # Days of week
            days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
            day_width = calendar_width / len(days)
            
            for i, day in enumerate(days):
                day_x = calendar_x + (i * day_width)
                
                # Highlight Friday
                if i == 4:
                    # Highlight background for Friday
                    draw.rectangle(
                        [(day_x, calendar_y + 50), (day_x + day_width, calendar_y + calendar_height)],
                        fill=(250, 255, 250)
                    )
                
                # Day header
                draw.rectangle(
                    [(day_x, calendar_y + 50), (day_x + day_width, calendar_y + 90)],
                    fill=(240, 240, 250)
                )
                
                draw.text(
                    (day_x + day_width//2, calendar_y + 70),
                    day,
                    font=regular_font, fill=TEXT_COLOR, anchor="mm"
                )
                
                # Date
                draw.text(
                    (day_x + day_width//2, calendar_y + 110),
                    f"April {i+8}",
                    font=small_font, fill=TEXT_COLOR, anchor="mm"
                )
                
                # Day events/milestones
                if scene_progress > 0.3:
                    events_y = calendar_y + 140
                    
                    if i == 1:  # Tuesday
                        # Margin optimization day
                        draw.rounded_rectangle(
                            [(day_x + 10, events_y), (day_x + day_width - 10, events_y + 60)],
                            radius=5, fill=(230, 240, 255), outline=HIGHLIGHT_COLOR
                        )
                        
                        draw.text(
                            (day_x + day_width//2, events_y + 15),
                            "Margin Optimization",
                            font=small_font, fill=TEXT_COLOR, anchor="mm"
                        )
                        
                        draw.text(
                            (day_x + day_width//2, events_y + 40),
                            "₹12,00,000 freed",
                            font=regular_font, fill=HIGHLIGHT_COLOR, anchor="mm"
                        )
                        
                        # New position entry
                        if scene_progress > 0.4:
                            position_y = events_y + 80
                            
                            draw.rounded_rectangle(
                                [(day_x + 10, position_y), (day_x + day_width - 10, position_y + 60)],
                                radius=5, fill=(230, 240, 255), outline=HIGHLIGHT_COLOR
                            )
                            
                            draw.text(
                                (day_x + day_width//2, position_y + 15),
                                "New Position",
                                font=small_font, fill=TEXT_COLOR, anchor="mm"
                            )
                            
                            draw.text(
                                (day_x + day_width//2, position_y + 40),
                                "CIPLA JUN FUT",
                                font=regular_font, fill=TEXT_COLOR, anchor="mm"
                            )
                    
                    elif i == 2:  # Wednesday
                        if scene_progress > 0.5:
                            # Price movement day 1
                            draw.rounded_rectangle(
                                [(day_x + 10, events_y), (day_x + day_width - 10, events_y + 60)],
                                radius=5, fill=(240, 255, 240), outline=(200, 230, 200)
                            )
                            
                            draw.text(
                                (day_x + day_width//2, events_y + 15),
                                "CIPLA Position",
                                font=small_font, fill=TEXT_COLOR, anchor="mm"
                            )
                            
                            draw.text(
                                (day_x + day_width//2, events_y + 40),
                                "+₹18,000",
                                font=regular_font, fill=POSITIVE_COLOR, anchor="mm"
                            )
                    
                    elif i == 3:  # Thursday
                        if scene_progress > 0.6:
                            # Price movement day 2
                            draw.rounded_rectangle(
                                [(day_x + 10, events_y), (day_x + day_width - 10, events_y + 60)],
                                radius=5, fill=(240, 255, 240), outline=(200, 230, 200)
                            )
                            
                            draw.text(
                                (day_x + day_width//2, events_y + 15),
                                "CIPLA Position",
                                font=small_font, fill=TEXT_COLOR, anchor="mm"
                            )
                            
                            draw.text(
                                (day_x + day_width//2, events_y + 40),
                                "+₹27,000",
                                font=regular_font, fill=POSITIVE_COLOR, anchor="mm"
                            )
                    
                    elif i == 4:  # Friday
                        if scene_progress > 0.7:
                            # Final result day
                            draw.rounded_rectangle(
                                [(day_x + 10, events_y), (day_x + day_width - 10, events_y + 60)],
                                radius=5, fill=(230, 255, 230), outline=(150, 200, 150), width=2
                            )
                            
                            draw.text(
                                (day_x + day_width//2, events_y + 15),
                                "CIPLA Position",
                                font=small_font, fill=TEXT_COLOR, anchor="mm"
                            )
                            
                            draw.text(
                                (day_x + day_width//2, events_y + 40),
                                "+₹65,000",
                                font=heading_font, fill=POSITIVE_COLOR, anchor="mm"
                            )
                            
                            # Return calculation
                            calc_y = events_y + 90
                            
                            draw.rounded_rectangle(
                                [(day_x + 10, calc_y), (day_x + day_width - 10, calc_y + 90)],
                                radius=5, fill=(255, 255, 240), outline=(220, 210, 180)
                            )
                            
                            draw.text(
                                (day_x + day_width//2, calc_y + 20),
                                "Return on Margin",
                                font=small_font, fill=TEXT_COLOR, anchor="mm"
                            )
                            
                            draw.text(
                                (day_x + day_width//2, calc_y + 50),
                                "5.65%",
                                font=heading_font, fill=POSITIVE_COLOR, anchor="mm"
                            )
                            
                            draw.text(
                                (day_x + day_width//2, calc_y + 75),
                                "(4 days)",
                                font=small_font, fill=TEXT_COLOR, anchor="mm"
                            )
            
            # Total week summary
            if scene_progress > 0.8:
                summary_y = calendar_y + calendar_height + 20
                
                draw.rounded_rectangle(
                    [(calendar_x, summary_y), (calendar_x + calendar_width, summary_y + 80)],
                    radius=10, fill=POSITIVE_COLOR, outline=(25, 120, 70), width=2
                )
                
                draw.text(
                    (calendar_x + 30, summary_y + 25),
                    "Weekly Profit from Optimized Margin:",
                    font=heading_font, fill=(255, 255, 255)
                )
                
                draw.text(
                    (calendar_x + calendar_width - 30, summary_y + 25),
                    "+₹65,000",
                    font=heading_font, fill=(255, 255, 255), anchor="ra"
                )
                
                draw.text(
                    (calendar_x + calendar_width - 30, summary_y + 60),
                    "Capital that would otherwise be sitting idle",
                    font=regular_font, fill=(255, 255, 255), anchor="ra"
                )
            
            # Mr. Sharma happy with results
            if scene_progress > 0.5:
                draw_businessman(
                    draw, WIDTH - 150, HEIGHT - 150,
                    size=120, expression="excited", action="thumbsup",
                    progress=scene_progress
                )
            
        elif scene == 8:
            # Weekly Performance Review scene
            # Dashboard with charts
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
            draw.rectangle(
                [(dashboard_x, dashboard_y), (dashboard_x + dashboard_width, dashboard_y + 50)],
                fill=HIGHLIGHT_COLOR
            )
            
            draw.text(
                (dashboard_x + dashboard_width//2, dashboard_y + 25),
                "Weekly Performance Review",
                font=heading_font, fill=(255, 255, 255), anchor="mm"
            )
            
            # Week selector
            week_y = dashboard_y + 70
            
            draw.text(
                (dashboard_x + 30, week_y),
                "Week:",
                font=regular_font, fill=TEXT_COLOR
            )
            
            weeks = ["Apr 1-5", "Apr 8-12", "Apr 15-19", "Apr 22-26"]
            week_width = 100
            week_x = dashboard_x + 100
            
            for i, week in enumerate(weeks):
                week_fill = HIGHLIGHT_COLOR if i == 1 else (240, 240, 240)
                week_text = (255, 255, 255) if i == 1 else TEXT_COLOR
                
                draw.rounded_rectangle(
                    [(week_x + i*week_width, week_y - 10), (week_x + (i+1)*week_width - 5, week_y + 25)],
                    radius=5, fill=week_fill
                )
                
                draw.text(
                    (week_x + i*week_width + week_width//2, week_y + 7),
                    week,
                    font=small_font, fill=week_text, anchor="mm"
                )
            
            # Performance metrics
            if scene_progress > 0.3:
                metrics_y = week_y + 50
                metric_width = (dashboard_width - 60) // 3
                metric_height = 100
                
                metrics = [
                    {
                        "title": "Margin Optimization",
                        "value": "₹12,00,000",
                        "subtitle": "Capital Freed",
                        "color": HIGHLIGHT_COLOR
                    },
                    {
                        "title": "Additional Profit",
                        "value": "₹65,000",
                        "subtitle": "From New Position",
                        "color": POSITIVE_COLOR
                    },
                    {
                        "title": "Return on Margin",
                        "value": "5.65%",
                        "subtitle": "4 Trading Days",
                        "color": POSITIVE_COLOR
                    }
                ]
                
                for i, metric in enumerate(metrics):
                    metric_x = dashboard_x + 30 + (i * metric_width)
                    
                    draw.rounded_rectangle(
                        [(metric_x, metrics_y), (metric_x + metric_width - 30, metrics_y + metric_height)],
                        radius=10, fill=(255, 255, 255), outline=(220, 220, 230), width=1
                    )
                    
                    draw.text(
                        (metric_x + 20, metrics_y + 20),
                        metric["title"],
                        font=regular_font, fill=TEXT_COLOR
                    )
                    
                    draw.text(
                        (metric_x + 20, metrics_y + 60),
                        metric["value"],
                        font=heading_font, fill=metric["color"]
                    )
                    
                    draw.text(
                        (metric_x + 20, metrics_y + 85),
                        metric["subtitle"],
                        font=small_font, fill=NEUTRAL_COLOR
                    )
            
            # Weekly chart
            if scene_progress > 0.5:
                chart_y = metrics_y + 120
                chart_height = 200
                chart_x = dashboard_x + 50
                chart_width = dashboard_width - 100
                
                # Chart title
                draw.text(
                    (dashboard_x + dashboard_width//2, chart_y),
                    "Daily Margin Efficiency",
                    font=regular_font, fill=TEXT_COLOR, anchor="mm"
                )
                
                # Chart background
                draw.rectangle(
                    [(chart_x, chart_y + 30), (chart_x + chart_width, chart_y + 30 + chart_height)],
                    fill=(250, 250, 255), outline=(220, 220, 230)
                )
                
                # Chart axes
                # Y-axis
                for i in range(6):
                    y_pos = chart_y + 30 + chart_height - (i * chart_height // 5)
                    
                    # Horizontal gridline
                    draw.line(
                        [(chart_x, y_pos), (chart_x + chart_width, y_pos)],
                        fill=(230, 230, 240)
                    )
                    
                    # Y-axis label
                    label = f"{i * 20}%"
                    draw.text(
                        (chart_x - 10, y_pos),
                        label,
                        font=small_font, fill=TEXT_COLOR, anchor="ra"
                    )
                
                # X-axis (days)
                days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
                day_width = chart_width / len(days)
                
                for i, day in enumerate(days):
                    x_pos = chart_x + (i * day_width) + (day_width / 2)
                    
                    draw.text(
                        (x_pos, chart_y + 30 + chart_height + 15),
                        day,
                        font=small_font, fill=TEXT_COLOR, anchor="mm"
                    )
                
                # Data points
                # Animate data points appearing
                progress_points = int(min(5, max(0, scene_progress - 0.5) * 10))
                
                efficiency_values = [10, 85, 82, 80, 78]  # Percentage of margin efficiency
                
                points = []
                for i in range(min(progress_points, len(efficiency_values))):
                    x_pos = chart_x + (i * day_width) + (day_width / 2)
                    y_pos = chart_y + 30 + chart_height - (efficiency_values[i] * chart_height / 100)
                    
                    points.append((x_pos, y_pos))
                    
                    # Draw point
                    point_color = POSITIVE_COLOR if efficiency_values[i] > 50 else NEUTRAL_COLOR
                    draw.ellipse(
                        [(x_pos - 5, y_pos - 5), (x_pos + 5, y_pos + 5)],
                        fill=point_color
                    )
                    
                    # Value label
                    draw.text(
                        (x_pos, y_pos - 15),
                        f"{efficiency_values[i]}%",
                        font=small_font, fill=point_color, anchor="mm"
                    )
                
                # Connect points with lines
                if len(points) > 1:
                    for i in range(len(points) - 1):
                        draw.line(
                            [points[i], points[i+1]],
                            fill=HIGHLIGHT_COLOR, width=2
                        )
                
                # Highlight Tuesday's jump
                if progress_points >= 2:
                    tuesday_x = chart_x + day_width + (day_width / 2)
                    tuesday_y = chart_y + 30 + chart_height - (efficiency_values[1] * chart_height / 100)
                    
                    # Draw vertical line to highlight the jump
                    draw.line(
                        [(tuesday_x, chart_y + 30 + chart_height), (tuesday_x, tuesday_y)],
                        fill=(255, 220, 150, 150), width=10
                    )
                    
                    # Callout
                    callout_y = tuesday_y - 60
                    
                    draw.rounded_rectangle(
                        [(tuesday_x - 100, callout_y), (tuesday_x + 100, callout_y + 40)],
                        radius=5, fill=HIGHLIGHT_COLOR
                    )
                    
                    draw.text(
                        (tuesday_x, callout_y + 20),
                        "AI Optimization Applied",
                        font=small_font, fill=(255, 255, 255), anchor="mm"
                    )
            
            # Analysis conclusion
            if scene_progress > 0.8:
                conclusion_y = chart_y + chart_height + 60
                
                draw.rounded_rectangle(
                    [(dashboard_x + 50, conclusion_y), (dashboard_x + dashboard_width - 50, conclusion_y + 80)],
                    radius=10, fill=(240, 255, 240), outline=POSITIVE_COLOR
                )
                
                draw.text(
                    (dashboard_x + dashboard_width//2, conclusion_y + 20),
                    "Weekly Performance Summary",
                    font=regular_font, fill=TEXT_COLOR, anchor="mm"
                )
                
                draw.text(
                    (dashboard_x + dashboard_width//2, conclusion_y + 50),
                    "The AI optimization on Tuesday freed up significant capital, resulting in 75% higher margin efficiency",
                    font=small_font, fill=TEXT_COLOR, anchor="mm"
                )
            
            # Mr. Sharma reviewing performance
            if scene_progress > 0.7:
                draw_businessman(
                    draw, 150, HEIGHT - 150,
                    size=100, expression="thinking", action="tablet",
                    progress=scene_progress
                )
            
        elif scene == 9:
            # Monthly ROI Calculation scene
            # Dashboard with charts
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
            draw.rectangle(
                [(dashboard_x, dashboard_y), (dashboard_x + dashboard_width, dashboard_y + 50)],
                fill=HIGHLIGHT_COLOR
            )
            
            draw.text(
                (dashboard_x + dashboard_width//2, dashboard_y + 25),
                "Monthly ROI Analysis",
                font=heading_font, fill=(255, 255, 255), anchor="mm"
            )
            
            # Month selector
            month_y = dashboard_y + 70
            
            draw.text(
                (dashboard_x + 30, month_y),
                "Month:",
                font=regular_font, fill=TEXT_COLOR
            )
            
            months = ["February", "March", "April", "May"]
            month_width = 120
            month_x = dashboard_x + 100
            
            for i, month in enumerate(months):
                month_fill = HIGHLIGHT_COLOR if i == 2 else (240, 240, 240)
                month_text = (255, 255, 255) if i == 2 else TEXT_COLOR
                
                draw.rounded_rectangle(
                    [(month_x + i*month_width, month_y - 10), (month_x + (i+1)*month_width - 5, month_y + 25)],
                    radius=5, fill=month_fill
                )
                
                draw.text(
                    (month_x + i*month_width + month_width//2, month_y + 7),
                    month,
                    font=small_font, fill=month_text, anchor="mm"
                )
            
            # Monthly optimization chart
            if scene_progress > 0.3:
                chart_y = month_y + 50
                chart_height = 200
                
                # Chart title
                draw.text(
                    (dashboard_x + dashboard_width//2, chart_y),
                    "Capital Freed by AI Margin Optimizer (April 2025)",
                    font=regular_font, fill=TEXT_COLOR, anchor="mm"
                )
                
                # Chart background
                chart_x = dashboard_x + 50
                chart_width = dashboard_width - 100
                
                draw.rectangle(
                    [(chart_x, chart_y + 30), (chart_x + chart_width, chart_y + 30 + chart_height)],
                    fill=(250, 250, 255), outline=(220, 220, 230)
                )
                
                # Y-axis labels (lakhs)
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
                
                # Animate bars appearing
                progress_bars = min(30, int(max(0, scene_progress - 0.3) * 60))
                
                # Bar chart data - capital freed over time
                # Create some realistic-looking data with the current week having higher values
                data = [
                    2.5, 5.8, 3.2, 7.1, 4.3, 3.8, 6.2,  # Week 1
                    5.5, 4.9, 8.3, 6.7, 7.2, 5.8, 9.1,  # Week 2
                    7.3, 6.8, 11.5, 8.4, 12.0, 9.3, 10.5,  # Week 3 (current)
                    8.2, 7.5, 6.4, 5.9, 10.2, 9.7, 8.8,  # Week 4
                    7.1, 8.3  # Partial Week 5
                ]
                
                # Draw visible bars
                bar_width = (chart_width - 30) / 30  # 30 days
                for i in range(min(progress_bars, len(data))):
                    value = data[i]
                    
                    bar_height = (value / 15) * chart_height
                    bar_x = chart_x + 15 + (i * bar_width)
                    bar_y = chart_y + 30 + chart_height - bar_height
                    
                    # Current day highlight (day 9, Tuesday of current week)
                    bar_color = HIGHLIGHT_COLOR if i == 18 else (100, 150, 250)
                    
                    draw.rectangle(
                        [(bar_x, bar_y), (bar_x + bar_width - 1, chart_y + 30 + chart_height)],
                        fill=bar_color
                    )
                
                # Weekly averages
                if scene_progress > 0.6:
                    # Group data by week and calculate average
                    weekly_avgs = []
                    for w in range(4):  # 4 complete weeks
                        week_data = data[w*7:(w+1)*7]
                        avg = sum(week_data) / len(week_data)
                        weekly_avgs.append(avg)
                    
                    # Draw week average lines
                    for i, avg in enumerate(weekly_avgs):
                        week_start_x = chart_x + 15 + (i * 7 * bar_width)
                        week_end_x = chart_x + 15 + ((i+1) * 7 * bar_width) - 1
                        avg_y = chart_y + 30 + chart_height - ((avg / 15) * chart_height)
                        
                        draw.line(
                            [(week_start_x, avg_y), (week_end_x, avg_y)],
                            fill=(220, 50, 50), width=2
                        )
                        
                        # Average label
                        draw.text(
                            (week_start_x + (3.5 * bar_width), avg_y - 15),
                            f"Avg: ₹{avg:.1f}L",
                            font=small_font, fill=(220, 50, 50), anchor="mm"
                        )
                
                # Current week highlight
                if scene_progress > 0.7:
                    current_week_x = chart_x + 15 + (2 * 7 * bar_width)
                    current_week_width = 7 * bar_width
                    
                    # Semi-transparent highlight for current week
                    draw.rectangle(
                        [(current_week_x, chart_y + 30), 
                         (current_week_x + current_week_width, chart_y + 30 + chart_height)],
                        fill=(255, 240, 200, 100), outline=(255, 200, 100)
                    )
                    
                    # "Current Week" label
                    draw.text(
                        (current_week_x + current_week_width/2, chart_y + 50),
                        "Current Week",
                        font=small_font, fill=HIGHLIGHT_COLOR, anchor="mm"
                    )
            
            # Total optimization result
            if scene_progress > 0.7:
                total_y = chart_y + chart_height + 50
                
                draw.rounded_rectangle(
                    [(dashboard_x + 50, total_y), (dashboard_x + dashboard_width - 50, total_y + 60)],
                    radius=10, fill=(240, 250, 255), outline=(200, 220, 240)
                )
                
                draw.text(
                    (dashboard_x + dashboard_width//2, total_y + 30),
                    "Total Capital Freed This Month: ₹42,00,000",
                    font=heading_font, fill=HIGHLIGHT_COLOR, anchor="mm"
                )
            
            # ROI calculation
            if scene_progress > 0.8:
                roi_y = total_y + 80
                
                draw.line(
                    [(dashboard_x + 30, roi_y), (dashboard_x + dashboard_width - 30, roi_y)],
                    fill=(220, 220, 230), width=1
                )
                
                draw.text(
                    (dashboard_x + dashboard_width//2, roi_y + 30),
                    "Return on Investment - AI Margin Optimizer",
                    font=regular_font, fill=TEXT_COLOR, anchor="mm"
                )
                
                # ROI metrics
                metrics_y = roi_y + 70
                col_width = dashboard_width // 3
                
                metrics = [
                    ["Additional Profit Generated", "+₹2,10,000"],
                    ["Monthly Subscription Cost", "₹12,000"],
                    ["Return on Investment", "17.5x"]
                ]
                
                for i, (metric, value) in enumerate(metrics):
                    metric_x = dashboard_x + (i * col_width) + (col_width // 2)
                    
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
            
            # Mr. Sharma excited about ROI
            if scene_progress > 0.6:
                draw_businessman(
                    draw, WIDTH - 150, HEIGHT - 170,
                    size=120, expression="excited", action="thumbsup",
                    progress=scene_progress
                )
            
        elif scene == 10:
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
            if scene_progress > 0.3:
                benefits_y = 270
                benefit_height = 80
                
                benefits = [
                    "More capital to trade with - without adding new funds",
                    "Simple, actionable recommendations with no technical expertise required",
                    "Measurable improvement in trading performance"
                ]
                
                for i, benefit in enumerate(benefits):
                    # Only show if far enough in the animation
                    if scene_progress > 0.3 + (i * 0.2):
                        benefit_y = benefits_y + (i * benefit_height)
                        
                        # Highlight box
                        alpha = min(1.0, (scene_progress - (0.3 + i * 0.2)) / 0.15)
                        
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
            
            # Customer success stories
            if scene_progress > 0.8:
                story_y = 530
                
                draw.rounded_rectangle(
                    [(WIDTH//2 - 350, story_y), (WIDTH - 100, story_y + 100)],
                    radius=10, fill=(255, 255, 255, 180)
                )
                
                draw.text(
                    (WIDTH//2 - 330, story_y + 20),
                    "Customer Success: Mr. Sharma",
                    font=heading_font, fill=TEXT_COLOR
                )
                
                draw.text(
                    (WIDTH//2 - 330, story_y + 60),
                    "Freed ₹12 lakhs of capital in one day\nGenerated ₹65,000 additional profit in one week\nAchieved 17.5x return on subscription investment",
                    font=regular_font, fill=TEXT_COLOR
                )
            
            # Call to action
            if scene_progress > 0.9:
                cta_y = 650
                
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
    print("Creating detailed Mr. Sharma demo video frames...")
    
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
    print(f"ffmpeg -r 10 -i {OUTPUT_DIR}/frame_%04d.png -c:v libx264 -pix_fmt yuv420p -crf 23 detailed_sharma_demo_video.mp4")

if __name__ == "__main__":
    create_sharma_demo()