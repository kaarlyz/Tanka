import sys
import json
import os

def transcribe(audio_path, language="id"):
    from faster_whisper import WhisperModel
    # Model 'large-v3-turbo' (800M+ params, model speech terkini OpenAI):
    # Akurasi tertinggi untuk bahasa Indonesia percakapan santai, analogi, istilah ilmiah, maupun bahasa sehari-hari.
    model = WhisperModel("large-v3-turbo", device="cpu", compute_type="int8")
    
    # Prompt terbuka: mencakup analogi sehari-hari, cara bicara santai, hingga istilah teknis/ilmiah tanpa disaring kaku
    natural_prompt = (
        "Transkripsi percakapan lisan bahasa Indonesia apa adanya. "
        "Mencakup gaya bertutur santai, analogi, contoh sehari-hari, bahasa gaul wajar, "
        "maupun istilah ilmiah dan logika yang sedang dijelaskan dengan bahasa sendiri."
    )
    
    segments, info = model.transcribe(
        audio_path,
        language=language,
        initial_prompt=natural_prompt,
        beam_size=5,
        best_of=5,
        temperature=0.0,
        vad_filter=True,
        vad_parameters=dict(min_silence_duration_ms=400),
        condition_on_previous_text=False
    )
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
