"""Accuracy check on 20 labelled samples. Run from the tests folder: python run_eval.py"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(ROOT))
from dotenv import load_dotenv  # noqa: E402
load_dotenv(ROOT / ".env")
from services.analyzer import analyze  # noqa: E402

samples = json.loads((Path(__file__).parent / "samples.json").read_text(encoding="utf-8"))
ok = 0
for i, s in enumerate(samples, 1):
    r = analyze(s["text"])
    pred = "scam" if r["verdict"] in ("scam", "suspicious") else "safe"
    hit = pred == s["label"]
    ok += hit
    print(f"{i:2d}. {'PASS' if hit else 'FAIL'}  expected={s['label']:5s} got={r['verdict']:10s} score={r['score']:3d}")
print(f"\nAccuracy: {ok}/{len(samples)} = {ok / len(samples):.0%}   (engine: {r['engine']})")
