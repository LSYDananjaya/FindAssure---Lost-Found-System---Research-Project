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

    # Convert mp4 → wav
    audio = file_path.replace(".mp4", ".wav")

    os.system(
        f'ffmpeg -y -i "{file_path}" -ar 16000 -ac 1 "{audio}"'
    )

    # Transcribe
    result = model.transcribe(audio)
    text = result["text"].strip()

    print("Transcription:", text)

    # Optional cleanup
    # if os.path.exists(audio):
    #     os.remove(audio)

    return text
