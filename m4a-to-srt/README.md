<!-- @format -->

# M4A to SRT Converter

A FastAPI application that converts M4A audio files to SRT subtitle format using OpenAI's Whisper model. Features configurable word segmentation and frame rate settings.

## Features

- 🎵 Convert M4A audio files to SRT subtitles
- 🤖 Powered by OpenAI Whisper for accurate transcription
- ⚙️ Configurable word segmentation per subtitle
- 🎬 Adjustable frame rate for timing calculations
- 🌐 Modern web interface with drag-and-drop
- 🚀 Optimized for Render deployment
- 📱 Responsive design for all devices

## Tech Stack

- **Backend**: FastAPI, Python 3.11
- **AI Model**: OpenAI Whisper
- **Audio Processing**: ffmpeg
- **Frontend**: HTML5, CSS3, JavaScript
- **Deployment**: Docker, Render

## Quick Start

### Local Development

1. **Clone and navigate to the backend directory:**

   ```bash
   cd m4a-to-srt/backend
   ```

2. **Install ffmpeg (required for audio processing):**

   ```bash
   # macOS
   brew install ffmpeg

   # Ubuntu/Debian
   sudo apt install ffmpeg

   # Windows
   # Download from https://ffmpeg.org/
   ```

3. **Install Python dependencies:**

   ```bash
   pip install --upgrade pip
   pip install torch --extra-index-url https://download.pytorch.org/whl/cpu
   pip install git+https://github.com/openai/whisper.git
   pip install -r requirements.txt
   ```

4. **Run the application:**

   ```bash
   python main.py
   ```

5. **Open your browser:**
   ```
   http://localhost:8000
   ```

### Render Deployment

#### Option 1: Using render.yaml (Recommended)

1. **Connect your GitHub repository to Render**
2. **Render will automatically detect the `render.yaml` file**
3. **Deploy with one click**

#### Option 2: Manual Deployment

1. **Create a new Web Service on Render**
2. **Connect your GitHub repository**
3. **Configure the service:**
   - **Environment**: Python
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Python Version**: 3.11.0

## API Endpoints

### POST `/convert/`

Convert M4A file to SRT format.

**Parameters:**

- `file` (required): M4A audio file
- `words_per_segment` (optional): Number of words per subtitle segment (default: 0 = no segmentation)
- `frame_rate` (optional): Frame rate for timing calculations (default: 30.0)

**Response:** SRT file download

### GET `/`

Serve the web interface

### GET `/health`

Health check endpoint

## Usage Examples

### Using the Web Interface

1. Open the application in your browser
2. Drag and drop an M4A file or click to select
3. Configure settings:
   - **Words per Segment**: Set to 0 for original Whisper segments, or specify a number
   - **Frame Rate**: Adjust for timing precision (default: 30.0)
4. Click "Convert to SRT"
5. Download the generated SRT file

### Using cURL

```bash
curl -X POST "https://your-app.onrender.com/convert/" \
  -F "file=@audio.m4a" \
  -F "words_per_segment=5" \
  -F "frame_rate=25.0" \
  --output subtitles.srt
```

### Using Python Requests

```python
import requests

with open('audio.m4a', 'rb') as f:
    files = {'file': f}
    data = {
        'words_per_segment': 5,
        'frame_rate': 25.0
    }
    response = requests.post('https://your-app.onrender.com/convert/',
                           files=files, data=data)

    if response.status_code == 200:
        with open('subtitles.srt', 'wb') as srt_file:
            srt_file.write(response.content)
```

## Configuration Options

### Words per Segment

- **0**: Keep original Whisper segments (recommended for most use cases)
- **1-10**: Create shorter segments for better readability
- **10+**: Create longer segments for fewer subtitle changes

### Frame Rate

- **24.0**: Film standard
- **25.0**: PAL video standard
- **30.0**: NTSC video standard (default)
- **60.0**: High frame rate content

## Performance Considerations

- **Model Size**: Uses Whisper "base" model for optimal speed/accuracy balance
- **Memory Usage**: Efficient singleton pattern for model loading
- **File Processing**: Automatic cleanup of temporary files
- **Concurrent Requests**: FastAPI handles multiple requests efficiently

## File Format Support

- **Input**: M4A audio files
- **Output**: SRT subtitle files (UTF-8 encoded)
- **Audio Conversion**: Automatic M4A to WAV conversion for Whisper processing

## Error Handling

The application includes comprehensive error handling for:

- Invalid file formats
- File upload errors
- Audio processing failures
- Whisper model errors
- Network timeouts

## Development

### Project Structure

```
m4a-to-srt/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── requirements.txt     # Python dependencies
│   ├── Dockerfile          # Docker configuration
│   ├── render.yaml         # Render deployment config
│   └── .dockerignore       # Docker ignore file
├── frontend/
│   └── index.html          # Web interface
└── README.md               # This file
```

### Adding Features

1. **New Audio Formats**: Extend `convert_audio_to_wav()` function
2. **Additional Models**: Modify `get_whisper_model()` for different Whisper models
3. **Custom Segmentation**: Enhance `segment_text_by_words()` function
4. **Output Formats**: Add new subtitle format converters

## Troubleshooting

### Common Issues

1. **"File must be in M4A format"**

   - Ensure your audio file has `.m4a` extension
   - Check file is not corrupted

2. **"Conversion failed"**

   - Verify audio file is valid
   - Check Render logs for detailed error messages
   - Ensure sufficient memory allocation

3. **Slow conversion**
   - Large files take longer to process
   - Consider using shorter audio clips for testing
   - Check Render service plan limits

### Render-Specific Issues

1. **Build failures**

   - Ensure all dependencies are in `requirements.txt`
   - Check Python version compatibility
   - Verify Dockerfile syntax

2. **Runtime errors**
   - Check Render logs for detailed error messages
   - Verify environment variables are set correctly
   - Ensure sufficient memory allocation for your plan

## License

This project is open source and available under the MIT License.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Support

For issues and questions:

1. Check the troubleshooting section
2. Review Render logs
3. Open an issue on GitHub
