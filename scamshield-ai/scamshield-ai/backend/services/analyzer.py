"""Core scam analysis: LLM (if key available) blended with link checks and the rule engine."""
import base64
import json
import os
import re
from pathlib import Path

from .links import analyze_links
from .rules import rule_analysis

PROMPT = (Path(__file__).resolve().parent.parent / "prompts" / "scam_prompt.txt").read_text(encoding="utf-8")

NEXT_STEPS_SCAM = [
    "Do not click any link, call back, or reply.",
    "Never share OTP, PIN, CVV or passwords with anyone.",
    "Block the sender and report it (India: cybercrime.gov.in or call 1930; US: reportfraud.ftc.gov).",
    "If you already shared details or paid, call your bank right away to freeze the account.",
]
NEXT_STEPS_SAFE = [
    "Looks fine, but verify through the official app or website if money or logins are involved.",
    "Never share OTP or passwords, even with real-looking senders.",
]


def _verdict(score: int) -> str:
    return "scam" if score >= 65 else "suspicious" if score >= 35 else "safe"


def _llm(text: str, image):
    if not os.getenv("ANTHROPIC_API_KEY"):
        return None
    try:
        from anthropic import Anthropic
        client = Anthropic()
        content = []
        if image:
            data, media = image
            content.append({"type": "image", "source": {"type": "base64", "media_type": media,
                                                         "data": base64.b64encode(data).decode()}})
        content.append({"type": "text", "text": "Analyze this content:\n\n" + (text or "(see the image)")})
        msg = client.messages.create(model=os.getenv("ANTHROPIC_MODEL", "claude-sonnet-4-6"),
                                     max_tokens=1200, system=PROMPT,
                                     messages=[{"role": "user", "content": content}])
        raw = "".join(b.text for b in msg.content if getattr(b, "type", "") == "text")
        raw = re.sub(r"^```(?:json)?|```$", "", raw.strip(), flags=re.M).strip()
        return json.loads(raw)
    except Exception as e:  # network, key, parse errors -> fall back to rules
        print("LLM error:", e)
        return None


def analyze(text: str = "", image=None, source: str = "text") -> dict:
    llm = _llm(text, image)
    extracted = (llm or {}).get("extracted_text", "") if image else ""
    body = text or extracted

    rule_score, rule_flags = rule_analysis(body)
    link_score, link_flags, urls = analyze_links(body)

    if llm:
        llm_score = max(0, min(int(llm.get("score", 0)), 100))
        # LLM leads; rules and links can lift the score but never hide a clear LLM verdict.
        score = max(llm_score, round(0.75 * llm_score + 0.25 * min(100, rule_score + link_score)))
        if link_score >= 50:
            score = max(score, 75)
        flags = (llm.get("red_flags") or []) + link_flags
        summary = llm.get("summary", "")
        scam_type = llm.get("scam_type", "None")
        steps = llm.get("next_steps") or []
        engine = "Claude + rules + link check"
    else:
        score = min(100, rule_score + link_score)
        flags = rule_flags + link_flags
        scam_type = "Possible scam" if score >= 35 else "None"
        summary = ("This message uses several classic scam tricks." if score >= 65 else
                   "A few things look risky, so be careful." if score >= 35 else
                   "I did not find common scam tricks in this one.")
        steps = []
        engine = "Rule engine + link check (add an API key for full AI)"

    score = max(0, min(100, int(score)))
    verdict = _verdict(score)
    if not steps:
        steps = NEXT_STEPS_SAFE if verdict == "safe" else NEXT_STEPS_SCAM
    if not body.strip():
        verdict, score, summary = "safe", 0, "I could not read any text from that file."

    return {
        "verdict": verdict, "score": score, "summary": summary, "scam_type": scam_type,
        "red_flags": flags[:8], "next_steps": steps[:5], "extracted_text": body,
        "links_found": urls, "source": source, "engine": engine,
    }
