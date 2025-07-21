#!/bin/bash

# M4A to SRT Converter - Startup Script
echo "🎵 Starting M4A to SRT Converter..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.11 or later."
    exit 1
fi

# Check if pip is installed
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip3 is not installed. Please install pip."
    exit 1
fi

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📚 Installing dependencies..."
pip install --upgrade pip
pip install torch --extra-index-url https://download.pytorch.org/whl/cpu
pip install git+https://github.com/openai/whisper.git
pip install -r requirements.txt

# Check if ffmpeg is installed (required for audio processing)
if ! command -v ffmpeg &> /dev/null; then
    echo "❌ Error: ffmpeg is required but not installed."
    echo "   Install ffmpeg:"
    echo "   - macOS: brew install ffmpeg"
    echo "   - Ubuntu: sudo apt install ffmpeg"
    echo "   - Windows: Download from https://ffmpeg.org/"
    echo "   - Or use: conda install ffmpeg"
    exit 1
else
    echo "✅ ffmpeg is installed"
fi

# Start the application
echo "🚀 Starting FastAPI server..."
echo "📱 Web interface: http://localhost:8000"
echo "📚 API docs: http://localhost:8000/docs"
echo "💚 Health check: http://localhost:8000/health"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

python main.py 