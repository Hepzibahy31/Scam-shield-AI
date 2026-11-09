"""Speech-to-text for call recordings using faster-whisper (runs locally)."""
import os
import tempfile

_model = None


def transcribe(data: bytes, filename: str = "audio.webm") -> str:
    global _model
    try:
        from faster_whisper import WhisperModel
    except ImportError as e:
        raise RuntimeError("faster-whisper is not installed. Run: pip install faster-whisper") from e
    if _model is None:
        _model = WhisperModel(os.getenv("WHISPER_MODEL", "base"), device="cpu", compute_type="int8")
    suffix = os.path.splitext(filename)[1] or ".webm"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as f:
        f.write(data)
        path = f.name
    try:
        segments, _ = _model.transcribe(path, vad_filter=True)
        return " ".join(s.text.strip() for s in segments).strip()
    finally:
        os.unlink(path)
