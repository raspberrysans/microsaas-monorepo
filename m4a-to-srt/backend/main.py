import os
import tempfile
import whisper
from typing import Optional
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import subprocess
import re
from datetime import timedelta

app = FastAPI(title="M4A to SRT Converter", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global whisper model instance for reuse
_model = None

def get_whisper_model():
    """Get or initialize the Whisper model singleton."""
    global _model
    if _model is None:
        _model = whisper.load_model("base")
    return _model

def format_timestamp(seconds: float) -> str:
    """Convert seconds to SRT timestamp format."""
    td = timedelta(seconds=seconds)
    hours = int(td.total_seconds() // 3600)
    minutes = int((td.total_seconds() % 3600) // 60)
    secs = int(td.total_seconds() % 60)
    millisecs = int((td.total_seconds() % 1) * 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{millisecs:03d}"

def segment_text_by_words(text: str, words_per_segment: int) -> list[str]:
    """Segment text into chunks based on word count."""
    words = text.split()
    segments = []
    for i in range(0, len(words), words_per_segment):
        segment = " ".join(words[i:i + words_per_segment])
        if segment.strip():
            segments.append(segment)
    return segments

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

def generate_srt(segments: list, words_per_segment: int, frame_rate: float) -> str:
    """Generate SRT content from Whisper segments."""
    srt_content = []
    segment_counter = 1
    
    for segment in segments:
        start_time = format_timestamp(segment["start"])
        end_time = format_timestamp(segment["end"])
        
        # Segment text by word count if specified
        if words_per_segment > 0:
            text_segments = segment_text_by_words(segment["text"], words_per_segment)
            segment_duration = segment["end"] - segment["start"]
            sub_segment_duration = segment_duration / len(text_segments)
            
            for i, text_segment in enumerate(text_segments):
                sub_start = segment["start"] + (i * sub_segment_duration)
                sub_end = sub_start + sub_segment_duration
                
                srt_content.append(f"{segment_counter}")
                srt_content.append(f"{format_timestamp(sub_start)} --> {format_timestamp(sub_end)}")
                srt_content.append(f"{text_segment.strip()}")
                srt_content.append("")
                segment_counter += 1
        else:
            srt_content.append(f"{segment_counter}")
            srt_content.append(f"{start_time} --> {end_time}")
            text_segment: str = segment['text']
            srt_content.append(f"{text_segment.strip()}")
            srt_content.append("")
            segment_counter += 1
    
    return "\n".join(srt_content)

@app.post("/api/convert")
async def convert_m4a_to_srt(
    file: UploadFile = File(...),
    words_per_segment: Optional[int] = Form(0, description="Number of words per subtitle segment (0 for no segmentation)"),
    frame_rate: Optional[float] = Form(30.0, description="Frame rate for timing calculations")
):
    """
    Convert M4A audio file to SRT subtitle format using OpenAI Whisper.
    
    Args:
        file: M4A audio file
        words_per_segment: Number of words per subtitle segment (0 = no segmentation)
        frame_rate: Frame rate for timing calculations (default: 30.0)
    
    Returns:
        SRT file as download
    """
    if not file.filename.lower().endswith('.m4a'):
        raise HTTPException(status_code=400, detail="File must be in M4A format")
    
    if words_per_segment < 0:
        raise HTTPException(status_code=400, detail="Words per segment must be non-negative")
    
    if frame_rate <= 0:
        raise HTTPException(status_code=400, detail="Frame rate must be positive")
    
    try:
        # Create temporary files
        with tempfile.NamedTemporaryFile(delete=False, suffix=".m4a") as temp_m4a:
            content = await file.read()
            temp_m4a.write(content)
            temp_m4a_path = temp_m4a.name
        
        # Convert M4A to WAV
        wav_path = convert_audio_to_wav(temp_m4a_path)
        
        # Load Whisper model and transcribe
        model = get_whisper_model()
        result = model.transcribe(wav_path)
        
        # Generate SRT content
        srt_content = generate_srt(result["segments"], words_per_segment, frame_rate)
        
        # Create temporary SRT file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".srt", mode="w", encoding="utf-8") as temp_srt:
            temp_srt.write(srt_content)
            temp_srt_path = temp_srt.name
        
        # Clean up temporary files
        os.unlink(temp_m4a_path)
        os.unlink(wav_path)
        
        # Return SRT file
        filename = file.filename.replace(".m4a", ".srt")
        
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
        # Clean up on error
        for path in [temp_m4a_path, wav_path]:
            if 'path' in locals() and os.path.exists(path):
                os.unlink(path)
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
    return {"message": "M4A to SRT Converter API", "status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 