#!/bin/bash

# Check if input directory is provided
if [ $# -eq 0 ]; then
    echo "Usage: $0 <input_directory>"
    exit 1
fi

# Directory containing images
IMG_DIR="$1"
# Output video file
OUT_VIDEO="slideshow.mp4"
# Frame rate (1 frame per 0.1s = 10 fps)
FPS=20

# Check if input directory exists
if [ ! -d "$IMG_DIR" ]; then
    echo "Error: Directory '$IMG_DIR' does not exist"
    exit 1
fi

# Ensure ffmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
    echo "ffmpeg could not be found. Please install ffmpeg first."
    exit 1
fi

# Create a sorted list of images (modify the pattern if your images have a different extension)
IMG_PATTERN="$IMG_DIR/*.png"

# Generate the video
ffmpeg -y -framerate $FPS -pattern_type glob -i "$IMG_PATTERN" \
  -c:v libx264 -pix_fmt yuv420p -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" "$OUT_VIDEO"

echo "Slideshow video created: $OUT_VIDEO"