import sys
import json
import os

def transcribe(audio_path, language="id"):
    from faster_whisper import WhisperModel
    # Using tiny model with int8 quantization for ultra-fast CPU inference (< 1.5s)
    model = WhisperModel("tiny", device="cpu", compute_type="int8")
    segments, info = model.transcribe(audio_path, language=language, beam_size=1)
    text = " ".join([seg.text.strip() for seg in segments])
    return text.strip()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "No audio file provided"}))
        sys.exit(1)
    audio_path = sys.argv[1]
    if not os.path.exists(audio_path):
        print(json.dumps({"success": False, "error": "Audio file not found"}))
        sys.exit(1)
    lang = sys.argv[2] if len(sys.argv) > 2 else "id"
    try:
        transcript = transcribe(audio_path, lang)
        print(json.dumps({"success": True, "text": transcript}))
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))
