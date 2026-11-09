"""ScamShield AI - FastAPI backend.  Run: uvicorn main:app --reload --port 8000"""
import os

from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, File, Form, HTTPException, UploadFile  # noqa: E402
from fastapi.middleware.cors import CORSMiddleware  # noqa: E402

from services import analyzer, ocr, speech  # noqa: E402

app = FastAPI(title="ScamShield AI")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

MAX_BYTES = 25 * 1024 * 1024
IMAGE_TYPES = {"image/png", "image/jpeg", "image/webp", "image/gif"}


@app.get("/api/health")
def health():
    return {"status": "ok", "llm_enabled": bool(os.getenv("ANTHROPIC_API_KEY"))}


@app.post("/api/analyze")
async def analyze_endpoint(text: str = Form(""), file: UploadFile | None = File(None)):
    if not text.strip() and not file:
        raise HTTPException(400, "Please paste a message or upload a file.")

    image, source, body = None, "text", text.strip()
    if file:
        data = await file.read()
        if len(data) > MAX_BYTES:
            raise HTTPException(413, "File is too large (max 25 MB).")
        ctype = (file.content_type or "").lower()
        name = (file.filename or "").lower()

        if ctype in IMAGE_TYPES or name.endswith((".png", ".jpg", ".jpeg", ".webp", ".gif")):
            media = ctype if ctype in IMAGE_TYPES else "image/jpeg"
            source = "screenshot"
            image = (data, media)
            if not os.getenv("ANTHROPIC_API_KEY"):  # no vision model -> try OCR
                body = (body + "\n" + ocr.image_to_text(data)).strip()
                image = None
                if not body:
                    raise HTTPException(422, "Reading screenshots needs ANTHROPIC_API_KEY or Tesseract OCR installed.")
        elif ctype.startswith(("audio/", "video/")) or name.endswith((".mp3", ".wav", ".m4a", ".ogg", ".webm", ".mp4", ".aac", ".flac")):
            source = "call recording"
            try:
                transcript = speech.transcribe(data, file.filename or "audio.webm")
            except RuntimeError as e:
                raise HTTPException(500, str(e))
            if not transcript:
                raise HTTPException(422, "I could not hear any speech in that recording.")
            body = (body + "\n" + transcript).strip()
        else:  # .txt / .eml / anything text-like
            source = "email / document"
            body = (body + "\n" + data.decode("utf-8", errors="ignore")).strip()

    return analyzer.analyze(body, image, source)
