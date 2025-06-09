#!/bin/bash

# Directory containing images
IMG_DIR="/Users/rasmus/Desktop/SELECTED/all-rats"
# Output video file
OUT_VIDEO="slideshow.mp4"
# Frame rate (1 frame per 0.1s = 10 fps)
FPS=20

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