#!/bin/bash

# PNG/JPEG to AVIF Converter using ImageMagick
# Converts all PNG, JPEG, and JPG files in the current directory to AVIF format

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if ImageMagick is installed
if ! command -v magick &> /dev/null && ! command -v convert &> /dev/null; then
    print_error "ImageMagick is not installed. Please install it first."
    echo "Ubuntu/Debian: sudo apt-get install imagemagick"
    echo "macOS: brew install imagemagick"
    echo "CentOS/RHEL: sudo yum install ImageMagick"
    exit 1
fi

# Check AVIF support
if ! magick identify -list format | grep -i avif &> /dev/null; then
    print_error "AVIF format is not supported by your ImageMagick installation."
    print_error "You may need to compile ImageMagick with libheif support."
    exit 1
fi

# Default quality setting (0-100, higher = better quality but larger files)
QUALITY=85
OVERWRITE=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -q|--quality)
            QUALITY="$2"
            shift 2
            ;;
        -o|--overwrite)
            OVERWRITE=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Convert all PNG, JPEG, and JPG files in current directory to AVIF format"
            echo ""
            echo "Options:"
            echo "  -q, --quality QUALITY   Set AVIF quality (0-100, default: 85)"
            echo "  -o, --overwrite        Overwrite existing AVIF files"
            echo "  -h, --help             Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0                     Convert with default quality (85)"
            echo "  $0 -q 90               Convert with quality 90"
            echo "  $0 -q 75 -o            Convert with quality 75 and overwrite existing"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            echo "Use -h or --help for usage information"
            exit 1
            ;;
    esac
done

# Validate quality parameter
if ! [[ "$QUALITY" =~ ^[0-9]+$ ]] || [ "$QUALITY" -lt 0 ] || [ "$QUALITY" -gt 100 ]; then
    print_error "Quality must be a number between 0 and 100"
    exit 1
fi

print_status "Starting conversion with quality: $QUALITY"
print_status "Overwrite existing files: $OVERWRITE"
echo ""

# Count files to convert
total_files=0
converted_files=0
skipped_files=0
error_files=0

# Count total files
for ext in png PNG jpeg JPEG jpg JPG; do
    if ls *."$ext" 1> /dev/null 2>&1; then
        total_files=$((total_files + $(ls *."$ext" 2>/dev/null | wc -l)))
    fi
done

if [ "$total_files" -eq 0 ]; then
    print_warning "No PNG, JPEG, or JPG files found in current directory"
    exit 0
fi

print_status "Found $total_files image(s) to process"
echo ""

# Convert function
convert_to_avif() {
    local input_file="$1"
    local output_file="${input_file%.*}.avif"
    
    # Check if output file exists and overwrite is disabled
    if [ -f "$output_file" ] && [ "$OVERWRITE" = false ]; then
        print_warning "Skipping $input_file -> $output_file already exists (use -o to overwrite)"
        skipped_files=$((skipped_files + 1))
        return
    fi
    
    print_status "Converting: $input_file -> $output_file"
    
    # Perform conversion
    if magick "$input_file" -quality "$QUALITY" "$output_file" 2>/dev/null; then
        # Get file sizes for comparison
        original_size=$(stat -f%z "$input_file" 2>/dev/null || stat -c%s "$input_file" 2>/dev/null)
        new_size=$(stat -f%z "$output_file" 2>/dev/null || stat -c%s "$output_file" 2>/dev/null)
        
        if [ -n "$original_size" ] && [ -n "$new_size" ]; then
            reduction=$((100 - (new_size * 100 / original_size)))
            print_success "Converted $input_file (${reduction}% size reduction)"
        else
            print_success "Converted $input_file"
        fi
        converted_files=$((converted_files + 1))
    else
        print_error "Failed to convert $input_file"
        error_files=$((error_files + 1))
    fi
}

# Process all image files
for ext in png PNG jpeg JPEG jpg JPG; do
    if ls *."$ext" 1> /dev/null 2>&1; then
        for file in *."$ext"; do
            if [ -f "$file" ]; then
                convert_to_avif "$file"
            fi
        done
    fi
done

# Print summary
echo ""
print_status "Conversion Summary:"
echo "  Total files found: $total_files"
echo "  Successfully converted: $converted_files"
echo "  Skipped (already exist): $skipped_files"
echo "  Errors: $error_files"

if [ "$converted_files" -gt 0 ]; then
    print_success "Conversion completed!"
elif [ "$skipped_files" -gt 0 ] && [ "$error_files" -eq 0 ]; then
    print_warning "All files were skipped (use -o to overwrite existing AVIF files)"
else
    print_error "No files were converted successfully"
fi