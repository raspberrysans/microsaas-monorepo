import os
import tempfile
import whisper
import logging
from typing import Optional
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import subprocess
import re
import json
from datetime import timedelta

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="M4A to SRT Converter", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    """Initialize the application on startup."""
    logger.info("Starting M4A to SRT Converter API...")
    try:
        # Preload the Whisper model
        get_whisper_model()
        logger.info("Application startup completed successfully")
    except Exception as e:
        logger.error(f"Failed to initialize application: {e}")
        # Don't raise here to allow the app to start even if model loading fails
        logger.warning("Continuing without preloaded model")

# Global whisper model instance for reuse
_model = None

def get_whisper_model():
    """Get or initialize the Whisper model singleton."""
    global _model
    if _model is None:
        logger.info("Loading Whisper model...")
        try:
            _model = whisper.load_model("base")
            logger.info("Whisper model loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load Whisper model: {e}")
            raise
    return _model

def format_timestamp(seconds: float) -> str:
    """Convert seconds to SRT timestamp format."""
    td = timedelta(seconds=seconds)
    hours = int(td.total_seconds() // 3600)
    minutes = int((td.total_seconds() % 3600) // 60)
    secs = int(td.total_seconds() % 60)
    millisecs = int((td.total_seconds() % 1) * 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{millisecs:03d}"

def convert_audio_to_wav(audio_path: str) -> str:
    """Convert M4A to WAV format for Whisper processing using ffmpeg."""
    wav_path = audio_path.replace(".m4a", ".wav")
    
    try:
        # Use ffmpeg to convert M4A to WAV
        subprocess.run([
            "ffmpeg", "-i", audio_path, 
            "-acodec", "pcm_s16le", 
            "-ar", "16000", 
            "-ac", "1", 
            wav_path
        ], check=True, capture_output=True)
        return wav_path
    except subprocess.CalledProcessError as e:
        raise Exception(f"FFmpeg conversion failed: {e.stderr.decode()}")
    except FileNotFoundError:
        raise Exception("FFmpeg not found. Please install ffmpeg.")

def transcribe_with_whisper_word_timestamps(audio_path: str) -> list:
    """Use OpenAI Whisper for transcription with word-level timestamps"""
    logger.info("Transcribing audio with Whisper word-level timestamps...")
    
    try:
        # Try to use whisper command line tool with word-level timestamps
        temp_dir = tempfile.mkdtemp()
        result = subprocess.run([
            'whisper', audio_path, 
            '--model', 'base',
            '--output_format', 'json',
            '--word_timestamps', 'True',
            '--output_dir', temp_dir
        ], capture_output=True, text=True, check=True)
        
        # Find the output JSON file
        base_name = os.path.splitext(os.path.basename(audio_path))[0]
        json_path = os.path.join(temp_dir, f"{base_name}.json")
        
        if os.path.exists(json_path):
            with open(json_path, 'r', encoding='utf-8') as f:
                whisper_result = json.load(f)
            
            # Extract word-level timestamps if available
            words_with_timing = []
            for segment in whisper_result.get('segments', []):
                if 'words' in segment:
                    for word_info in segment['words']:
                        words_with_timing.append({
                            'word': word_info['word'].strip(),
                            'start': word_info['start'],
                            'end': word_info['end']
                        })
                else:
                    # Fallback to segment-level timing
                    segment_words = segment['text'].strip().split()
                    word_duration = (segment['end'] - segment['start']) / len(segment_words) if segment_words else 0
                    for i, word in enumerate(segment_words):
                        words_with_timing.append({
                            'word': word,
                            'start': segment['start'] + (i * word_duration),
                            'end': segment['start'] + ((i + 1) * word_duration)
                        })
            
            # Clean up
            try:
                os.unlink(json_path)
                os.rmdir(temp_dir)
            except:
                pass
            
            return words_with_timing
            
    except (subprocess.CalledProcessError, FileNotFoundError):
        logger.warning("Whisper CLI not found or failed, falling back to Python whisper...")
        return transcribe_with_python_whisper(audio_path)

def transcribe_with_python_whisper(audio_path: str) -> list:
    """Fallback transcription using Python whisper library"""
    logger.info("Transcribing audio with Python whisper library...")
    
    try:
        model = get_whisper_model()
        result = model.transcribe(audio_path, word_timestamps=True)
        
        words_with_timing = []
        for segment in result.get('segments', []):
            if 'words' in segment:
                for word_info in segment['words']:
                    words_with_timing.append({
                        'word': word_info['word'].strip(),
                        'start': word_info['start'],
                        'end': word_info['end']
                    })
            else:
                # Fallback to segment-level timing
                segment_words = segment['text'].strip().split()
                word_duration = (segment['end'] - segment['start']) / len(segment_words) if segment_words else 0
                for i, word in enumerate(segment_words):
                    words_with_timing.append({
                        'word': word,
                        'start': segment['start'] + (i * word_duration),
                        'end': segment['start'] + ((i + 1) * word_duration)
                    })
        
        return words_with_timing
        
    except Exception as e:
        logger.error(f"Python whisper transcription failed: {e}")
        raise

def group_words_into_subtitles(words_with_timing: list, max_words: int) -> list:
    """Group words into subtitles based on max_words parameter"""
    if not words_with_timing:
        return []
    
    subtitles = []
    current_group = []
    
    for word_info in words_with_timing:
        current_group.append(word_info)
        
        # Check if we should create a new subtitle
        if len(current_group) >= max_words:
            if current_group:
                subtitle_text = ' '.join([w['word'] for w in current_group])
                start_time = current_group[0]['start']
                end_time = current_group[-1]['end']
                
                subtitles.append({
                    'text': subtitle_text.strip(),
                    'start_time': start_time,
                    'end_time': end_time
                })
            
            current_group = []
    
    # Handle remaining words
    if current_group:
        subtitle_text = ' '.join([w['word'] for w in current_group])
        start_time = current_group[0]['start']
        end_time = current_group[-1]['end']
        
        subtitles.append({
            'text': subtitle_text.strip(),
            'start_time': start_time,
            'end_time': end_time
        })
    
    return subtitles

def generate_srt_from_subtitles(subtitles: list) -> str:
    """Generate SRT content from subtitle segments."""
    srt_content = []
    
    for i, subtitle in enumerate(subtitles, 1):
        start_time = format_timestamp(subtitle['start_time'])
        end_time = format_timestamp(subtitle['end_time'])
        
        srt_content.append(f"{i}")
        srt_content.append(f"{start_time} --> {end_time}")
        srt_content.append(f"{subtitle['text']}")
        srt_content.append("")
    
    return "\n".join(srt_content)

@app.post("/api/convert")
async def convert_m4a_to_srt(
    file: UploadFile = File(...),
    words_per_segment: Optional[int] = Form(8, description="Number of words per subtitle segment (default: 8)"),
    frame_rate: Optional[float] = Form(30.0, description="Frame rate for timing calculations (default: 30.0)")
):
    logger.info(f"Received conversion request for file: {file.filename}")
    """
    Convert M4A audio file to SRT subtitle format using OpenAI Whisper with word-level timing.
    
    Args:
        file: M4A audio file
        words_per_segment: Number of words per subtitle segment (default: 8)
        frame_rate: Frame rate for timing calculations (default: 25.0)
    
    Returns:
        SRT file as download
    """
    if not file.filename.lower().endswith('.m4a'):
        raise HTTPException(status_code=400, detail="File must be in M4A format")
    
    if words_per_segment < 1:
        raise HTTPException(status_code=400, detail="Words per segment must be at least 1")
    
    if frame_rate <= 0:
        raise HTTPException(status_code=400, detail="Frame rate must be positive")
    
    temp_m4a_path = None
    wav_path = None
    
    try:
        logger.info("Creating temporary files...")
        # Create temporary files
        with tempfile.NamedTemporaryFile(delete=False, suffix=".m4a") as temp_m4a:
            content = await file.read()
            temp_m4a.write(content)
            temp_m4a_path = temp_m4a.name
        logger.info(f"Temporary file created: {temp_m4a_path}")
        
        # Convert M4A to WAV
        logger.info("Converting M4A to WAV...")
        wav_path = convert_audio_to_wav(temp_m4a_path)
        logger.info(f"WAV file created: {wav_path}")
        
        # Transcribe audio with word-level timestamps
        logger.info("Transcribing audio with word-level timestamps...")
        words_with_timing = transcribe_with_whisper_word_timestamps(wav_path)
        
        if not words_with_timing:
            raise HTTPException(status_code=400, detail="No speech detected in audio file")
        
        logger.info(f"Transcription completed with {len(words_with_timing)} words")
        
        # Group words into subtitles
        logger.info(f"Grouping words into subtitles (max {words_per_segment} words per subtitle)...")
        subtitles = group_words_into_subtitles(words_with_timing, words_per_segment)
        
        # Generate SRT content
        logger.info("Generating SRT content...")
        srt_content = generate_srt_from_subtitles(subtitles)
        
        # Create temporary SRT file
        logger.info("Creating SRT file...")
        with tempfile.NamedTemporaryFile(delete=False, suffix=".srt", mode="w", encoding="utf-8") as temp_srt:
            temp_srt.write(srt_content)
            temp_srt_path = temp_srt.name
        logger.info(f"SRT file created: {temp_srt_path}")
        
        # Clean up temporary files
        logger.info("Cleaning up temporary files...")
        os.unlink(temp_m4a_path)
        os.unlink(wav_path)
        
        # Return SRT file
        filename = file.filename.replace(".m4a", ".srt")
        logger.info(f"Returning SRT file: {filename}")
        logger.info(f"Generated {len(subtitles)} subtitles")
        
        async def cleanup():
            try:
                os.unlink(temp_srt_path)
            except OSError:
                pass  # File might already be deleted
        
        return FileResponse(
            temp_srt_path,
            media_type="application/x-subrip",
            filename=filename,
            background=cleanup
        )
        
    except Exception as e:
        logger.error(f"Conversion failed: {str(e)}")
        # Clean up on error
        for path in [temp_m4a_path, wav_path]:
            if path and os.path.exists(path):
                try:
                    os.unlink(path)
                except OSError:
                    pass
        raise HTTPException(status_code=500, detail=f"Conversion failed: {str(e)}")

@app.get("/", response_class=HTMLResponse)
async def root():
    """Serve the frontend interface."""
    try:
        with open("../frontend/index.html", "r", encoding="utf-8") as f:
            return HTMLResponse(content=f.read())
    except FileNotFoundError:
        return HTMLResponse(content="""
        <html>
            <head><title>M4A to SRT API</title></head>
            <body>
                <h1>M4A to SRT Converter API</h1>
                <p>API is running. Use POST /api/convert to convert M4A files to SRT.</p>
                <p>Frontend not found. Please deploy the frontend separately or check the file path.</p>
            </body>
        </html>
        """)

@app.get("/health")
async def health():
    """Health check endpoint."""
    logger.info("Health check endpoint called")
    return {"message": "M4A to SRT Converter API", "status": "healthy"}

@app.get("/test")
async def test():
    """Simple test endpoint."""
    logger.info("Test endpoint called")
    return {"message": "API is working", "timestamp": "2024-01-01"}

@app.options("/api/convert")
async def options_convert():
    """Handle preflight requests for the convert endpoint."""
    from fastapi.responses import Response
    response = Response()
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "POST, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "*"
    return response

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port) 