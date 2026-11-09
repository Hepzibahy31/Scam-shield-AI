"""Fallback OCR (used only when no LLM key is set). Needs Tesseract installed on the OS."""
import io


def image_to_text(data: bytes) -> str:
    try:
        import pytesseract
        from PIL import Image
        return pytesseract.image_to_string(Image.open(io.BytesIO(data))).strip()
    except Exception:
        return ""
