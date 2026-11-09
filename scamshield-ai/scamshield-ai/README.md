# ScamShield AI  (with Hepsi, your AI guardian)

Upload or paste a suspicious **SMS, email, screenshot, link or call recording**.
Hepsi (animated, speaking AI guide) welcomes you, asks for the content, analyses it and tells you
**if it is a scam or safe**, why, and what to do next.

## Folder structure
```
scamshield-ai/
├── backend/   FastAPI + Gen AI (Claude) + Whisper + link checks + rule engine
├── frontend/  React + Vite (animated Hepsi, score meter, red-flag highlighter, share card)
└── tests/     20 labelled samples + evaluation script (for your accuracy slide)
```

## 1. Run the backend  (Python 3.10+)
```bash
cd backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env              # then paste your ANTHROPIC_API_KEY inside
uvicorn main:app --reload --port 8000
```
Check: http://localhost:8000/api/health

* **With an API key:** full Gen AI analysis (text + screenshots).
* **Without a key:** the built-in rule engine still works for text, so the app never breaks.
* **Call recordings:** transcribed locally by `faster-whisper` (first run downloads the model, ~150 MB).

## 2. Run the frontend  (Node 18+)
```bash
cd frontend
npm install
npm run dev
```
Open http://localhost:5173 and click **Meet Hepsi**.
(Use Chrome or Edge for the best voice. Browsers only allow speech after a click, so the first click starts her welcome.)

## 3. Evaluate accuracy (for your report)
```bash
cd tests
python run_eval.py
```

## How it works
User input -> (Whisper for audio / Claude vision for images) -> link checks + rule engine + LLM
-> blended Scam Score -> JSON -> Hepsi speaks the verdict, UI shows score, red flags, advice.

## Honest limits (mention in your viva)
* It is a **checker tool**, not an automatic call blocker. Auto-protection (phone app / email plugin) is future scope.
* No uploads are stored; files are processed in memory only.
* AI can be wrong. The result always says "verify with the official source".
