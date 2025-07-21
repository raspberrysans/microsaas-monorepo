<!-- @format -->

# M4A to SRT Converter - Deployment Guide

## Render Deployment

This guide explains how to deploy the M4A to SRT converter on Render.

### API Endpoint

The main conversion endpoint is:

```
POST /api/convert
```

### Environment Variables

Set these environment variables in your Render service:

- `PORT`: The port your app will run on (Render sets this automatically)
- `PYTHON_VERSION`: Set to `3.11` or higher

### Build Configuration

1. **Build Command**: `pip install -r requirements.txt`
2. **Start Command**: `python main.py`

### API Usage

#### Convert M4A to SRT

**Endpoint**: `POST /api/convert`

**Parameters**:

- `file`: M4A audio file (multipart/form-data)
- `words_per_segment` (optional): Number of words per subtitle segment (default: 0)
- `frame_rate` (optional): Frame rate for timing calculations (default: 30.0)

**Example using curl**:

```bash
curl -X POST "https://your-app.onrender.com/api/convert" \
  -F "file=@audio.m4a" \
  -F "words_per_segment=10" \
  -F "frame_rate=30.0" \
  --output subtitles.srt
```

**Example using JavaScript**:

```javascript
const formData = new FormData();
formData.append('file', audioFile);
formData.append('words_per_segment', '10');
formData.append('frame_rate', '30.0');

const response = await fetch('https://your-app.onrender.com/api/convert', {
	method: 'POST',
	body: formData,
});

if (response.ok) {
	const blob = await response.blob();
	// Download the SRT file
	const url = window.URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = 'subtitles.srt';
	a.click();
}
```

### Health Check

**Endpoint**: `GET /health`

Returns the API status.

### Frontend Integration

The frontend is served at the root path `/` and automatically calls the `/api/convert` endpoint.

### Dependencies

The application requires:

- Python 3.11+
- FFmpeg (for audio conversion)
- OpenAI Whisper (for speech recognition)

### Notes

- The API supports CORS for cross-origin requests
- Files are processed temporarily and cleaned up automatically
- Maximum file size depends on your Render plan limits
- Processing time depends on audio length and complexity
