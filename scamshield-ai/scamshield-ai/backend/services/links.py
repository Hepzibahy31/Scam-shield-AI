"""URL extraction and suspicious-link checks (rules + optional Google Safe Browsing)."""
import os
import re
from urllib.parse import urlparse


URL_RE = re.compile(r"(https?://[^\s<>\"']+|www\.[^\s<>\"']+|\b[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:xyz|top|click|link|info|live|shop|icu|buzz|rest|cfd|vip)\b[^\s]*|\bbit\.ly/[^\s]+|\btinyurl\.com/[^\s]+)", re.I)
SHORTENERS = {"bit.ly", "tinyurl.com", "t.co", "goo.gl", "is.gd", "cutt.ly", "rb.gy", "shorturl.at", "tiny.cc", "ow.ly"}
BAD_TLDS = {"xyz", "top", "click", "link", "icu", "buzz", "rest", "cfd", "vip", "live", "shop", "info"}
BRANDS = ["paypal", "amazon", "google", "microsoft", "apple", "netflix", "sbi", "hdfc", "icici", "paytm",
          "phonepe", "bank", "irs", "fedex", "dhl", "usps", "instagram", "facebook", "whatsapp"]


def extract_urls(text: str):
    urls = [u.rstrip(".,);]") for u in URL_RE.findall(text or "")]
    return list(dict.fromkeys(urls))


def check_url(url: str):
    """Return (risk_points, [reasons]) for one URL."""
    reasons, pts = [], 0
    full = url if url.lower().startswith("http") else "http://" + url
    p = urlparse(full)
    host = (p.hostname or "").lower()
    if not host:
        return 0, []
    if host in SHORTENERS:
        pts += 20; reasons.append(f"{host} is a link shortener that hides the real destination")
    if re.fullmatch(r"\d{1,3}(\.\d{1,3}){3}", host):
        pts += 30; reasons.append("link uses a raw IP address instead of a website name")
    if url.lower().startswith("http://"):
        pts += 8; reasons.append("link is not encrypted (http)")
    if "@" in p.netloc:
        pts += 25; reasons.append("link contains '@' which can disguise the real site")
    if host.startswith("xn--") or ".xn--" in host:
        pts += 25; reasons.append("link uses look-alike (punycode) characters")
    tld = host.rsplit(".", 1)[-1]
    if tld in BAD_TLDS:
        pts += 12; reasons.append(f".{tld} domains are very common in scams")
    if host.count("-") >= 2:
        pts += 10; reasons.append("domain has many hyphens, a common trick")
    if host.count(".") >= 3:
        pts += 8; reasons.append("domain has many sub-domains, possibly hiding the real one")
    root = ".".join(host.split(".")[-2:])
    for b in BRANDS:
        if b in host and not root.startswith(b + "."):
            pts += 25; reasons.append(f"link mentions '{b}' but is not the real {b} website"); break
    return min(pts, 60), reasons


def safe_browsing(urls):
    key = os.getenv("SAFE_BROWSING_KEY")
    if not key or not urls:
        return []
    body = {
        "client": {"clientId": "scamshield", "clientVersion": "1.0"},
        "threatInfo": {
            "threatTypes": ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE"],
            "platformTypes": ["ANY_PLATFORM"],
            "threatEntryTypes": ["URL"],
            "threatEntries": [{"url": u} for u in urls],
        },
    }
    try:
        import httpx
        r = httpx.post(f"https://safebrowsing.googleapis.com/v4/threatMatches:find?key={key}", json=body, timeout=6)
        return [m["threat"]["url"] for m in r.json().get("matches", [])]
    except Exception:
        return []


def analyze_links(text: str):
    urls = extract_urls(text)
    flags, total = [], 0
    for u in urls:
        pts, why = check_url(u)
        total += pts
        for w in why:
            flags.append({"text": u, "reason": w})
    for u in safe_browsing(urls):
        total += 60
        flags.append({"text": u, "reason": "Google Safe Browsing lists this link as dangerous"})
    return min(total, 80), flags, urls
