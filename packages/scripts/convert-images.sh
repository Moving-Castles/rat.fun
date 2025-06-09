#!/bin/bash

# Check if directory is provided
if [ -z "$1" ]; then
    echo "Please provide the directory containing the images"
    echo "Usage: ./convert-images.sh /path/to/images"
    exit 1
fi

# Check if directory exists
if [ ! -d "$1" ]; then
    echo "Directory $1 does not exist"
    exit 1
fi

# Find all PNG files and convert them
find "$1" -name "*.png" -type f | while read -r file; do
    echo "Converting $file"
    # Create a temporary file with .tmp extension
    tmp_file="${file}.tmp"
    # Convert using sips
    sips -s format png "$file" --out "$tmp_file" > /dev/null
    # If conversion was successful, replace original file
    if [ $? -eq 0 ]; then
        mv "$tmp_file" "$file"
        echo "Successfully converted $file"
    else
        echo "Failed to convert $file"
        rm -f "$tmp_file"
    fi
done

echo "Conversion complete!" 