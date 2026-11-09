"""Offline rule engine. Works with no API key and is blended with the LLM result."""
import re

RULES = [
    (r"\b(otp|one[- ]time (password|code)|cvv|pin|password|passcode)\b", 22, "asks for a secret code or password"),
    (r"\b(share|send|tell|give|read out)\b.{0,30}\b(otp|pin|cvv|code|password)\b", 20, "tells you to hand over a secret code"),
    (r"\b(urgent|immediately|within \d+ ?(hours?|minutes?)|last warning|final notice|act now|expires? (today|soon))\b", 14, "creates fake urgency"),
    (r"\b(account|card|sim|number|wallet)\b.{0,25}\b(blocked|suspended|locked|deactivated|closed|compromised)\b", 20, "threatens to block your account"),
    (r"\b(kyc|verify|re-?verify|update)\b.{0,25}\b(account|details|identity|pan|aadhaar|bank|kyc|card)\b", 16, "asks you to verify details through a message"),
    (r"\b(won|winner|lottery|prize|jackpot|reward|lucky draw|cashback|gift card|free gift)\b", 18, "promises a prize or reward"),
    (r"\b(processing fee|registration fee|customs fee|release fee|advance (payment|fee)|pay a (small )?fee|pay.{0,20}to (claim|receive|release))\b", 24, "asks for an advance fee"),
    (r"\b(gift ?cards?|itunes|google play card|bitcoin|crypto|usdt|western union|wire transfer)\b", 16, "asks for untraceable payment"),
    (r"\b(arrest|police|cbi|customs|narcotics|court|legal action|warrant|digital arrest|fir)\b", 20, "threatens legal action or arrest"),
    (r"\b(work from home|earn \$?\d+|part[- ]time job|daily income|guaranteed (profit|returns?)|double your money)\b", 18, "offers too-good-to-be-true money"),
    (r"\b(remote access|anydesk|teamviewer|quicksupport|install (this )?app)\b", 22, "asks you to install remote-access software"),
    (r"\b(dear (customer|user|sir|madam|winner)|valued customer)\b", 8, "uses a generic greeting"),
    (r"\b(do not tell|don'?t tell|keep (this )?(secret|confidential)|do not disconnect)\b", 18, "asks you to keep it secret"),
    (r"\b(refund|undelivered|package|parcel|delivery)\b.{0,40}\b(fee|link|click|reschedule)\b", 14, "fake delivery or refund notice"),
    (r"\b(virus|malware|hacked|infected)\b.{0,40}\b(pc|computer|laptop|phone|device|account)\b|\b(pc|computer|device)\b.{0,25}\b(virus|infected|hacked)\b", 24, "fake tech-support virus warning"),
    (r"\b(microsoft|apple|google|amazon) (support|technician|security team)\b", 14, "claims to be big-company support"),
    (r"\b(new number|lost my phone)\b", 14, "classic 'family emergency, new number' trick"),
    (r"\b(click|tap|open)\b.{0,20}\b(link|here|below)\b", 8, "pushes you to click a link"),
]

SAFE_HINTS = [
    (r"\b(do not share (this )?(otp|code)|never share (your )?(otp|code)|don'?t share (your )?(otp|code))\b", -30),
    (r"\b(your order|receipt|invoice|appointment|meeting|see you|thanks|thank you|lunch|dinner|class|homework)\b", -6),
    (r"\b(is your (otp|verification code))\b", -10),
]


def rule_analysis(text: str):
    low = (text or "").lower()
    score, flags = 0, []
    for pat, pts, reason in RULES:
        m = re.search(pat, low, re.I | re.S)
        if m:
            score += pts
            flags.append({"text": text[m.start():m.end()].strip()[:90], "reason": reason})
    for pat, pts in SAFE_HINTS:
        if re.search(pat, low, re.I):
            score += pts
    return max(0, min(score, 100)), flags
