import subprocess
import os

def compile_video_with_ffmpeg(image_folder: str, output_video: str, fps: int = 30) -> None:
    # Ensure the output folder exists
    if not os.path.exists(image_folder):
        print(f"Image folder '{image_folder}' does not exist.")
        return

    # Construct the ffmpeg command
    ffmpeg_command = [
        "ffmpeg",
        "-y",  # Overwrite output file if it exists
        "-framerate", str(fps),
        "-i", os.path.join(image_folder, "frame_%04d.png"),  # Input image sequence
        "-c:v", "libx264",  # Video codec
        "-pix_fmt", "yuv420p",  # Pixel format for compatibility
        output_video
    ]

    try:
        # Execute the ffmpeg command
        subprocess.run(ffmpeg_command, check=True)
        print(f"Video compiled successfully and saved as {output_video}.")
    except subprocess.CalledProcessError as e:
        print(f"Error occurred while compiling video: {e}")

# Example usage
if __name__ == "__main__":
    compile_video_with_ffmpeg("saved_frames", "output_video.mp4", fps=30)