import { useCallback, useEffect, useRef, useState } from "react";
import Hepsi from "./components/Hepsi.jsx";
import Uploader from "./components/Uploader.jsx";
import Result from "./components/Result.jsx";
import { analyze } from "./api.js";
import { speak, stopSpeaking } from "./speech.js";

const WELCOME = "Hi, welcome! I'm Hepsi, your scam guardian. Please upload your call recording, email, or message, and I will tell you if it is a scam or if it is safe.";

function verdictLine(r) {
  if (r.verdict === "scam")
    return `Warning! This is a scam message. ${r.summary} Please do not click any link, reply, or share any code. I have listed what to do next.`;
  if (r.verdict === "suspicious")
    return `Be careful. This looks suspicious. ${r.summary} Please verify it with the official source before you do anything.`;
  return `Good news! This looks safe. ${r.summary} Still, never share your OTP with anyone.`;
}

export default function App() {
  const [stage, setStage] = useState("intro"); // intro | ask | scanning | result
  const [mood, setMood] = useState("happy");
  const [talking, setTalking] = useState(false);
  const [waving, setWaving] = useState(false);
  const [caption, setCaption] = useState("Tap the button and I'll say hello.");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [muted, setMuted] = useState(false);
  const mutedRef = useRef(false);
  mutedRef.current = muted;

  const say = useCallback(async (text, nextMood) => {
    if (nextMood) setMood(nextMood);
    setCaption(text);
    if (mutedRef.current) return;
    await speak(text, { onStart: () => setTalking(true), onEnd: () => setTalking(false) });
  }, []);

  useEffect(() => () => stopSpeaking(), []);

  async function start() {
    setStage("ask");
    setWaving(true);
    setTimeout(() => setWaving(false), 3200);
    await say(WELCOME, "happy");
  }

  async function run({ text, file }) {
    setError(""); setStage("scanning"); stopSpeaking(); setTalking(false);
    setMood("think"); setCaption("Let me take a careful look at this…");
    if (!mutedRef.current) speak("Give me a moment, I am checking it carefully.", { onStart: () => setTalking(true), onEnd: () => setTalking(false) });
    try {
      const r = await analyze({ text, file });
      setResult(r); setStage("result");
      await say(verdictLine(r), r.verdict === "scam" ? "alert" : r.verdict === "suspicious" ? "worried" : "safe");
    } catch (e) {
      setError(e.message); setStage("ask");
      await say("Oops, I could not check that. " + e.message, "worried");
    }
  }

  function again() {
    setResult(null); setStage("ask");
    say("Okay! Please upload the next message, email, or call recording.", "happy");
  }

  return (
    <main className={`app ${stage} v-${result?.verdict || "none"}`}>
      <header className="top">
        <div className="logo"><span>🛡</span> ScamShield AI</div>
        <button className="ghost small" onClick={() => { setMuted(!muted); stopSpeaking(); setTalking(false); }}>
          {muted ? "🔇 Voice off" : "🔊 Voice on"}
        </button>
      </header>

      <div className="layout">
        <aside className="stage">
          <div className="orb"><Hepsi mood={mood} talking={talking} waving={waving} /></div>
          <div className="bubble" aria-live="polite">
            <span className="name">Hepsi</span>
            <p>{caption}</p>
          </div>
        </aside>

        <section className="panel">
          {stage === "intro" && (
            <div className="intro">
              <h1>Got a message that feels off?</h1>
              <p>Hepsi reads SMS, emails, screenshots and call recordings, then tells you in plain words whether it is a scam.</p>
              <button className="primary big" onClick={start}>Meet Hepsi</button>
              <p className="tiny">Turn your sound on. Hepsi speaks.</p>
            </div>
          )}

          {(stage === "ask" || stage === "scanning") && (
            <div className="ask">
              <h2>What should I check?</h2>
              <Uploader onSubmit={run} disabled={stage === "scanning"} />
              {error && <p className="err" role="alert">{error}</p>}
              {stage === "scanning" && <div className="scan"><i /><span>Hepsi is scanning…</span></div>}
            </div>
          )}

          {stage === "result" && result && (
            <Result r={result} onAgain={again} onReplay={() => say(verdictLine(result))} />
          )}
        </section>
      </div>
    </main>
  );
}
