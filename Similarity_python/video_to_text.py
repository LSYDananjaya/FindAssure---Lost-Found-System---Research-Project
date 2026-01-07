import whisper
import os

# Load model once
model = whisper.load_model("base")

def extract_text(file_path: str) -> str:
    """
    Convert video to audio and transcribe using Whisper
    """

    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")

    # Convert video to audio (works with mp4, mov, etc.)
    # Create a unique output filename to avoid FFmpeg in-place editing error
    base_path, ext = os.path.splitext(file_path)
    audio = base_path + "_audio.wav"

    # Extract audio from video using FFmpeg
    os.system(
        f'ffmpeg -y -i "{file_path}" -ar 16000 -ac 1 "{audio}" 2>&1'
    )

    # Transcribe audio using Whisper
    result = model.transcribe(audio)
    text = result["text"].strip()

    print("Transcription:", text)

    # Cleanup temporary audio file
    if os.path.exists(audio):
        os.remove(audio)
    
    # Cleanup temporary video file
    if os.path.exists(file_path):
        os.remove(file_path)

    return text
