import os
import tempfile
import whisper
import logging
import asyncio
import uuid
from typing import Optional, Dict, Any
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import subprocess
import json
from datetime import timedelta
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Supported languages for input and translation
SUPPORTED_LANGUAGES = {
    'auto': 'Auto-detect',
    'en': 'English',
    'hi': 'Hindi',
    'ko': 'Korean',
    'ja': 'Japanese',
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'it': 'Italian',
    'pt': 'Portuguese',
    'ru': 'Russian',
    'zh': 'Chinese',
    'ar': 'Arabic'
}

# Language code mapping for Whisper (some codes differ from Google Translate)
WHISPER_LANGUAGE_MAP = {
    'auto': None,  # Let Whisper auto-detect
    'en': 'en',
    'hi': 'hi',
    'ko': 'ko',
    'ja': 'ja',
    'es': 'es',
    'fr': 'fr',
    'de': 'de',
    'it': 'it',
    'pt': 'pt',
    'ru': 'ru',
    'zh': 'zh',
    'ar': 'ar'
}

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
    logger.info("Application startup completed successfully")
    # Note: Whisper model will be loaded on first request to avoid startup timeout

# Global whisper model instance for reuse
_model = None

# Global request tracking
_current_request: Optional[Dict[str, Any]] = None
_current_task: Optional[asyncio.Task] = None

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

def cancel_current_request():
    """Cancel the current ongoing request if any."""
    global _current_request, _current_task
    if _current_task and not _current_task.done():
        logger.info(f"Cancelling request: {_current_request['id'] if _current_request else 'unknown'}")
        _current_task.cancel()
        return True
    return False

def register_new_request(request_id: str, filename: str):
    """Register a new request and cancel any existing one."""
    global _current_request
    cancelled_request = None
    
    # Cancel current request if exists
    if _current_request:
        cancelled_request = _current_request.copy()
        cancel_current_request()
    
    # Register new request
    _current_request = {
        "id": request_id,
        "filename": filename,
        "status": "processing"
    }
    
    return cancelled_request

async def check_cancellation():
    """Check if current task should be cancelled."""
    if asyncio.current_task() and asyncio.current_task().cancelled():
        raise asyncio.CancelledError("Request was cancelled")

def format_timestamp(seconds: float) -> str:
    """Convert seconds to SRT timestamp format."""
    td = timedelta(seconds=seconds)
    hours = int(td.total_seconds() // 3600)
    minutes = int((td.total_seconds() % 3600) // 60)
    secs = int(td.total_seconds() % 60)
    millisecs = int((td.total_seconds() % 1) * 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{millisecs:03d}"

async def convert_audio_to_wav(audio_path: str) -> str:
    """Convert M4A to WAV format for Whisper processing using ffmpeg."""
    wav_path = audio_path.replace(".m4a", ".wav")
    
    try:
        await check_cancellation()
        
        # Use ffmpeg to convert M4A to WAV
        process = await asyncio.create_subprocess_exec(
            "ffmpeg", "-i", audio_path, 
            "-acodec", "pcm_s16le", 
            "-ar", "16000", 
            "-ac", "1", 
            wav_path,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        
        stdout, stderr = await process.communicate()
        
        await check_cancellation()
        
        if process.returncode != 0:
            raise Exception(f"FFmpeg conversion failed: {stderr.decode()}")
            
        return wav_path
    except asyncio.CancelledError:
        # Clean up partial file if exists
        if os.path.exists(wav_path):
            try:
                os.unlink(wav_path)
            except OSError:
                pass
        raise
    except FileNotFoundError:
        raise Exception("FFmpeg not found. Please install ffmpeg.")

async def transcribe_with_whisper_word_timestamps(audio_path: str, input_language: Optional[str] = None) -> tuple[list, dict]:
    """Use OpenAI Whisper for transcription with word-level timestamps"""
    logger.info("Transcribing audio with Whisper word-level timestamps...")
    
    try:
        await check_cancellation()
        
        # Try to use whisper command line tool with word-level timestamps
        temp_dir = tempfile.mkdtemp()
        
        # Build command with optional language parameter
        cmd = [
            'whisper', audio_path, 
            '--model', 'base',
            '--output_format', 'json',
            '--word_timestamps', 'True',
            '--output_dir', temp_dir
        ]
        
        # Add language parameter if specified
        if input_language and input_language in WHISPER_LANGUAGE_MAP:
            whisper_lang = WHISPER_LANGUAGE_MAP[input_language]
            if whisper_lang:  # Only add if not None (auto-detect)
                cmd.extend(['--language', whisper_lang])
        
        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        
        stdout, stderr = await process.communicate()
        
        await check_cancellation()
        
        if process.returncode != 0:
            raise subprocess.CalledProcessError(process.returncode, 'whisper')
        
        # Find the output JSON file
        base_name = os.path.splitext(os.path.basename(audio_path))[0]
        json_path = os.path.join(temp_dir, f"{base_name}.json")
        
        if os.path.exists(json_path):
            with open(json_path, 'r', encoding='utf-8') as f:
                whisper_result = json.load(f)
            
            await check_cancellation()
            
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
            
            return words_with_timing, whisper_result
            
    except asyncio.CancelledError:
        # Clean up temp directory if exists
        try:
            if 'temp_dir' in locals():
                for file in os.listdir(temp_dir):
                    os.unlink(os.path.join(temp_dir, file))
                os.rmdir(temp_dir)
        except:
            pass
        raise
    except (subprocess.CalledProcessError, FileNotFoundError):
        logger.warning("Whisper CLI not found or failed, falling back to Python whisper...")
        return await transcribe_with_python_whisper(audio_path, input_language)

async def transcribe_with_python_whisper(audio_path: str, input_language: Optional[str] = None) -> tuple[list, dict]:
    """Fallback transcription using Python whisper library"""
    logger.info("Transcribing audio with Python whisper library...")
    
    try:
        await check_cancellation()
        
        # Run whisper in a thread pool to avoid blocking
        loop = asyncio.get_event_loop()
        model = get_whisper_model()
        
        await check_cancellation()
        
        # This is a CPU-intensive operation, so we run it in a thread
        # Prepare transcription parameters
        transcribe_params = {'word_timestamps': True}
        
        # Add language parameter if specified
        if input_language and input_language in WHISPER_LANGUAGE_MAP:
            whisper_lang = WHISPER_LANGUAGE_MAP[input_language]
            if whisper_lang:  # Only add if not None (auto-detect)
                transcribe_params['language'] = whisper_lang
        
        result = await loop.run_in_executor(
            None, 
            lambda: model.transcribe(audio_path, **transcribe_params)
        )
        
        await check_cancellation()
        
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
        
        return words_with_timing, result
        
    except asyncio.CancelledError:
        logger.info("Python whisper transcription cancelled")
        raise
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

def use_natural_segments(whisper_result: dict) -> list:
    """Use Whisper's natural segments instead of word-based grouping"""
    subtitles = []
    
    for segment in whisper_result.get('segments', []):
        subtitles.append({
            'text': segment['text'].strip(),
            'start_time': segment['start'],
            'end_time': segment['end']
        })
    
    return subtitles

def make_subtitles_contiguous(subtitles: list) -> list:
    """Ensure each subtitle displays until the next one starts (no gaps).

    Adjusts end_time of each subtitle (except the last) to match the next
    subtitle's start_time if there is a gap. Overlapping segments are left as-is.
    """
    if not subtitles:
        return subtitles
    for i in range(len(subtitles) - 1):
        current = subtitles[i]
        next_start = subtitles[i + 1]['start_time']
        if next_start > current['end_time']:
            current['end_time'] = next_start
    return subtitles

async def translate_subtitles(subtitles: list, target_language: str, source_language: str = 'auto') -> list:
    """Translate subtitle text to target language using batch translation for better accuracy."""
    if target_language == 'auto' or target_language == source_language:
        return subtitles
    
    logger.info(f"Translating {len(subtitles)} subtitles from {source_language} to {target_language}...")
    
    # Extract all text for batch translation (better context and accuracy)
    texts_to_translate = [subtitle['text'] for subtitle in subtitles]
    
    # Translate all texts together
    translated_texts = await translate_text_batch(
        texts_to_translate,
        target_language,
        source_language
    )
    
    # Combine translated texts with original timing
    translated_subtitles = []
    for i, subtitle in enumerate(subtitles):
        translated_subtitles.append({
            'text': translated_texts[i],
            'start_time': subtitle['start_time'],
            'end_time': subtitle['end_time']
        })
    
    logger.info(f"Translation completed: {len(translated_subtitles)} subtitles translated successfully")
    return translated_subtitles

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

async def process_conversion_async(
    temp_m4a_path: str, 
    words_per_segment: Optional[int], 
    frame_rate: float,
    use_natural_segmentation: bool = False,
    input_language: str = 'auto'
) -> tuple[str, str]:
    """Main async conversion logic that can be cancelled."""
    wav_path = None
    
    try:
        # Convert M4A to WAV
        logger.info("Converting M4A to WAV...")
        wav_path = await convert_audio_to_wav(temp_m4a_path)
        logger.info(f"WAV file created: {wav_path}")
        
        # Transcribe audio with word-level timestamps
        logger.info(f"Transcribing audio with word-level timestamps (input language: {input_language})...")
        words_with_timing, whisper_result = await transcribe_with_whisper_word_timestamps(wav_path, input_language)
        
        if not words_with_timing and not whisper_result.get('segments'):
            raise HTTPException(status_code=400, detail="No speech detected in audio file")
        
        logger.info(f"Transcription completed with {len(words_with_timing)} words")
        
        await check_cancellation()
        
        # Choose segmentation method
        if use_natural_segmentation:
            logger.info("Using Whisper's natural segmentation...")
            subtitles = use_natural_segments(whisper_result)
            # When using language detection with natural segmentation, ensure
            # subtitles persist on screen until the next sentence begins.
            subtitles = make_subtitles_contiguous(subtitles)
        else:
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
        
        # Clean up WAV file
        if wav_path and os.path.exists(wav_path):
            os.unlink(wav_path)
        
        logger.info(f"Generated {len(subtitles)} subtitles")
        return srt_content, temp_srt_path
        
    except asyncio.CancelledError:
        logger.info("Conversion process cancelled")
        # Clean up files
        if wav_path and os.path.exists(wav_path):
            try:
                os.unlink(wav_path)
            except OSError:
                pass
        raise
    except Exception as e:
        # Clean up on error
        if wav_path and os.path.exists(wav_path):
            try:
                os.unlink(wav_path)
            except OSError:
                pass
        raise

@app.post("/api/convert")
async def convert_m4a_to_srt(
    file: UploadFile = File(...),
    words_per_segment: Optional[int] = Form(8, description="Number of words per subtitle segment (default: 8)"),
    frame_rate: Optional[float] = Form(30.0, description="Frame rate for timing calculations (default: 30.0)"),
    use_natural_segmentation: Optional[bool] = Form(False, description="Use Whisper's natural segmentation instead of word-based grouping"),
    input_language: Optional[str] = Form('auto', description="Input audio language (default: auto-detect)")
):
    global _current_task, _current_request
    
    # Generate unique request ID
    request_id = str(uuid.uuid4())
    
    logger.info(f"Received conversion request {request_id} for file: {file.filename}")
    
    """
    Convert M4A audio file to SRT subtitle format using OpenAI Whisper with word-level timing.
    Cancels any previous ongoing request.
    
    Args:
        file: M4A audio file
        words_per_segment: Number of words per subtitle segment (default: 8)
        frame_rate: Frame rate for timing calculations (default: 30.0)
    
    Returns:
        SRT file as download or cancellation info
    """
    if not file.filename.lower().endswith('.m4a'):
        raise HTTPException(status_code=400, detail="File must be in M4A format")
    
    if not use_natural_segmentation and words_per_segment < 1:
        raise HTTPException(status_code=400, detail="Words per segment must be at least 1")
    
    if frame_rate <= 0:
        raise HTTPException(status_code=400, detail="Frame rate must be positive")
    
    # Validate language parameter
    if input_language not in SUPPORTED_LANGUAGES:
        raise HTTPException(status_code=400, detail=f"Unsupported input language: {input_language}")
    
    # Register new request and handle cancellation
    cancelled_request = register_new_request(request_id, file.filename)
    
    temp_m4a_path = None
    
    try:
        logger.info(f"Request {request_id}: Creating temporary files...")
        
        # Create temporary files
        with tempfile.NamedTemporaryFile(delete=False, suffix=".m4a") as temp_m4a:
            content = await file.read()
            temp_m4a.write(content)
            temp_m4a_path = temp_m4a.name
        logger.info(f"Request {request_id}: Temporary file created: {temp_m4a_path}")
        
        # Create and store the processing task
        async def conversion_task():
            return await process_conversion_async(
                temp_m4a_path, 
                words_per_segment, 
                frame_rate, 
                use_natural_segmentation,
                input_language
            )
        
        _current_task = asyncio.create_task(conversion_task())
        
        # Wait for the conversion to complete
        srt_content, temp_srt_path = await _current_task
        
        # Clean up M4A file
        logger.info(f"Request {request_id}: Cleaning up temporary files...")
        if temp_m4a_path and os.path.exists(temp_m4a_path):
            os.unlink(temp_m4a_path)
        
        # Mark request as completed
        if _current_request and _current_request["id"] == request_id:
            _current_request["status"] = "completed"
        
        # Return SRT content and download info
        filename = file.filename.replace(".m4a", ".srt")
        logger.info(f"Request {request_id}: Returning SRT content and download info: {filename}")
        
        # Prepare response with cancellation info if applicable
        response_data = {
            "status": "success",
            "request_id": request_id,
            "filename": filename,
            "srt_content": srt_content,
            "download_token": request_id  # Use request_id as download token
        }
        
        if cancelled_request:
            response_data["cancelled_request"] = {
                "id": cancelled_request["id"],
                "filename": cancelled_request["filename"]
            }
            logger.info(f"Request {request_id}: Cancelled previous request {cancelled_request['id']} ({cancelled_request['filename']})")
        
        # Store the temp file path for download endpoint
        if not hasattr(app.state, 'temp_files'):
            app.state.temp_files = {}
        app.state.temp_files[request_id] = temp_srt_path
        
        return JSONResponse(content=response_data)
        
    except asyncio.CancelledError:
        logger.info(f"Request {request_id}: Conversion was cancelled")
        # Clean up files
        if temp_m4a_path and os.path.exists(temp_m4a_path):
            try:
                os.unlink(temp_m4a_path)
            except OSError:
                pass
        
        # Return cancellation response
        return JSONResponse(
            status_code=200,
            content={
                "status": "cancelled",
                "request_id": request_id,
                "message": f"Request {request_id} for '{file.filename}' was cancelled"
            }
        )
        
    except Exception as e:
        logger.error(f"Request {request_id}: Conversion failed: {str(e)}")
        
        # Clean up on error
        if temp_m4a_path and os.path.exists(temp_m4a_path):
            try:
                os.unlink(temp_m4a_path)
            except OSError:
                pass
        
        # Clear current request on error
        if _current_request and _current_request["id"] == request_id:
            _current_request = None
            _current_task = None
        
        raise HTTPException(status_code=500, detail=f"Conversion failed: {str(e)}")
    
    finally:
        # Clean up task reference if this was the current task
        if _current_task and _current_task.done():
            _current_task = None

@app.get("/", response_class=HTMLResponse)
async def root():
    """Serve the frontend interface."""
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

@app.get("/api/languages")
async def get_supported_languages():
    """Get list of supported languages for input and translation."""
    return {"languages": SUPPORTED_LANGUAGES}

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

@app.get("/api/download/{download_token}")
async def download_srt_file(download_token: str):
    """Download the SRT file using the download token"""
    if not hasattr(app.state, 'temp_files') or download_token not in app.state.temp_files:
        raise HTTPException(status_code=404, detail="Download token not found or expired")
    
    temp_srt_path = app.state.temp_files[download_token]
    
    if not os.path.exists(temp_srt_path):
        # Clean up the expired token
        del app.state.temp_files[download_token]
        raise HTTPException(status_code=404, detail="File not found or expired")
    
    # Generate filename from the token (you might want to store this differently)
    filename = f"converted_{download_token[:8]}.srt"
    
    async def cleanup():
        try:
            os.unlink(temp_srt_path)
            if hasattr(app.state, 'temp_files') and download_token in app.state.temp_files:
                del app.state.temp_files[download_token]
        except OSError:
            pass  # File might already be deleted
    
    return FileResponse(
        temp_srt_path,
        media_type="application/x-subrip",
        filename=filename,
        background=cleanup
    )

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
    logger.info(f"Starting server on host 0.0.0.0 port {port}")
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info") 