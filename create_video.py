import os
import subprocess
import sys

def install_ffmpeg():
    """Check if ffmpeg is available, if not try to install it"""
    try:
        subprocess.run(['ffmpeg', '-version'], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        print("FFmpeg is already installed.")
        return True
    except FileNotFoundError:
        print("FFmpeg not found. Attempting to install...")
        
        try:
            # Try to install ffmpeg
            subprocess.run(['apt-get', 'update'], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            subprocess.run(['apt-get', 'install', '-y', 'ffmpeg'], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            print("FFmpeg installed successfully.")
            return True
        except Exception as e:
            print(f"Failed to install FFmpeg: {e}")
            return False

def create_video(input_pattern, output_file, framerate=10):
    """Create a video from image sequence using FFmpeg"""
    cmd = [
        'ffmpeg',
        '-y',  # Overwrite output file if it exists
        '-framerate', str(framerate),
        '-i', input_pattern,
        '-c:v', 'libx264',
        '-pix_fmt', 'yuv420p',
        '-crf', '23',  # Quality (lower is better, 18-28 is typical)
        output_file
    ]
    
    try:
        subprocess.run(cmd, check=True)
        print(f"Video created successfully: {output_file}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error creating video: {e}")
        return False

def main():
    # Install FFmpeg if needed
    if not install_ffmpeg():
        print("Cannot continue without FFmpeg.")
        sys.exit(1)
    
    # Check if demo frames exist
    frames_dir = "demo_frames"
    if not os.path.exists(frames_dir) or not os.listdir(frames_dir):
        print("No frames found in 'demo_frames' directory.")
        print("Run create_demo_video.py first.")
        sys.exit(1)
    
    # Create video
    input_pattern = f"{frames_dir}/frame_%04d.png"
    output_file = "ai_margin_optimizer_demo.mp4"
    
    print("Creating video...")
    if create_video(input_pattern, output_file):
        print(f"Video size: {os.path.getsize(output_file) / (1024*1024):.2f} MB")
        print("You can now download the video file.")

if __name__ == "__main__":
    main()