import os
import tempfile
import whisper
import logging
import asyncio
import uuid
from typing import Optional, Dict, Any
from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Depends
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import subprocess
import json
from datetime import timedelta
from dotenv import load_dotenv
from firebase_config import initialize_firebase, increment_user_usage
from auth_middleware import require_conversion_access, get_user_with_permissions

# Load environment variables
load_dotenv()

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
    
    # Initialize Firebase Admin SDK
    try:
        initialize_firebase()
        logger.info("Firebase initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize Firebase: {e}")
        # Don't fail startup, but log the error
    
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

async def transcribe_with_whisper_word_timestamps(audio_path: str) -> list:
    """Use OpenAI Whisper for transcription with word-level timestamps"""
    logger.info("Transcribing audio with Whisper word-level timestamps...")
    
    try:
        await check_cancellation()
        
        # Try to use whisper command line tool with word-level timestamps
        temp_dir = tempfile.mkdtemp()
        process = await asyncio.create_subprocess_exec(
            'whisper', audio_path, 
            '--model', 'base',
            '--output_format', 'json',
            '--word_timestamps', 'True',
            '--output_dir', temp_dir,
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
            
            return words_with_timing
            
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
        return await transcribe_with_python_whisper(audio_path)

async def transcribe_with_python_whisper(audio_path: str) -> list:
    """Fallback transcription using Python whisper library"""
    logger.info("Transcribing audio with Python whisper library...")
    
    try:
        await check_cancellation()
        
        # Run whisper in a thread pool to avoid blocking
        loop = asyncio.get_event_loop()
        model = get_whisper_model()
        
        await check_cancellation()
        
        # This is a CPU-intensive operation, so we run it in a thread
        result = await loop.run_in_executor(
            None, 
            lambda: model.transcribe(audio_path, word_timestamps=True)
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
        
        return words_with_timing
        
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
    words_per_segment: int, 
    frame_rate: float
) -> str:
    """Main async conversion logic that can be cancelled."""
    wav_path = None
    
    try:
        # Convert M4A to WAV
        logger.info("Converting M4A to WAV...")
        wav_path = await convert_audio_to_wav(temp_m4a_path)
        logger.info(f"WAV file created: {wav_path}")
        
        # Transcribe audio with word-level timestamps
        logger.info("Transcribing audio with word-level timestamps...")
        words_with_timing = await transcribe_with_whisper_word_timestamps(wav_path)
        
        if not words_with_timing:
            raise HTTPException(status_code=400, detail="No speech detected in audio file")
        
        logger.info(f"Transcription completed with {len(words_with_timing)} words")
        
        await check_cancellation()
        
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
        return temp_srt_path
        
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
    user_permissions: dict = Depends(require_conversion_access)
):
    global _current_task, _current_request
    
    # Generate unique request ID
    request_id = str(uuid.uuid4())
    uid = user_permissions['uid']
    email = user_permissions['email']
    is_admin = user_permissions['is_admin']
    
    logger.info(f"Received conversion request {request_id} for file: {file.filename} from user: {email} (Admin: {is_admin})")
    
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
    
    if words_per_segment < 1:
        raise HTTPException(status_code=400, detail="Words per segment must be at least 1")
    
    if frame_rate <= 0:
        raise HTTPException(status_code=400, detail="Frame rate must be positive")
    
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
            return await process_conversion_async(temp_m4a_path, words_per_segment, frame_rate)
        
        _current_task = asyncio.create_task(conversion_task())
        
        # Wait for the conversion to complete
        temp_srt_path = await _current_task
        
        # Clean up M4A file
        logger.info(f"Request {request_id}: Cleaning up temporary files...")
        if temp_m4a_path and os.path.exists(temp_m4a_path):
            os.unlink(temp_m4a_path)
        
        # Mark request as completed
        if _current_request and _current_request["id"] == request_id:
            _current_request["status"] = "completed"
        
        # Increment user usage (only for non-admin users)
        if not is_admin:
            try:
                await increment_user_usage(uid)
                logger.info(f"Request {request_id}: Incremented usage for user {email}")
            except Exception as e:
                logger.error(f"Request {request_id}: Failed to increment usage: {e}")
                # Don't fail the request if usage increment fails
        
        # Return SRT file
        filename = file.filename.replace(".m4a", ".srt")
        logger.info(f"Request {request_id}: Returning SRT file: {filename}")
        
        async def cleanup():
            try:
                os.unlink(temp_srt_path)
            except OSError:
                pass  # File might already be deleted
        
        # Prepare response with cancellation info if applicable
        headers = {}
        if cancelled_request:
            headers["X-Cancelled-Request"] = cancelled_request["id"]
            headers["X-Cancelled-Filename"] = cancelled_request["filename"]
            headers["X-Current-Request"] = request_id
            headers["X-Current-Filename"] = file.filename
            logger.info(f"Request {request_id}: Cancelled previous request {cancelled_request['id']} ({cancelled_request['filename']})")
        
        return FileResponse(
            temp_srt_path,
            media_type="application/x-subrip",
            filename=filename,
            background=cleanup,
            headers=headers
        )
        
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

@app.get("/api/user/status")
async def get_user_status(user_permissions: dict = Depends(get_user_with_permissions)):
    """Get current user status and usage information"""
    user_data = user_permissions['user_data']
    max_free_conversions = 999999 if user_permissions['is_admin'] else 2
    
    return {
        "email": user_permissions['email'],
        "isAdmin": user_permissions['is_admin'],
        "conversionsUsed": user_data.get('conversionsUsed', 0),
        "maxFreeConversions": max_free_conversions,
        "canConvert": user_permissions['can_convert'],
        "remainingConversions": max_free_conversions - user_data.get('conversionsUsed', 0) if not user_permissions['is_admin'] else 999999
    }

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