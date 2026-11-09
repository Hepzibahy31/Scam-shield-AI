import { useRef, useState } from "react";

export default function Uploader({ onSubmit, disabled }) {
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [drag, setDrag] = useState(false);
  const [rec, setRec] = useState(false);
  const [secs, setSecs] = useState(0);
  const [err, setErr] = useState("");
  const recorder = useRef(null);
  const timer = useRef(null);
  const input = useRef(null);

  const pick = (f) => { if (f) { setFile(f); setErr(""); } };

  async function toggleRecord() {
    if (rec) { recorder.current?.stop(); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const chunks = [];
      const mr = new MediaRecorder(stream);
      mr.ondataavailable = (e) => chunks.push(e.data);
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        clearInterval(timer.current);
        setRec(false);
        const blob = new Blob(chunks, { type: mr.mimeType || "audio/webm" });
        pick(new File([blob], "recording.webm", { type: blob.type }));
      };
      mr.start();
      recorder.current = mr;
      setSecs(0); setRec(true);
      timer.current = setInterval(() => setSecs((s) => s + 1), 1000);
    } catch {
      setErr("Microphone is blocked. Allow mic access in your browser, or upload an audio file instead.");
    }
  }

  function go() {
    if (!text.trim() && !file) { setErr("Paste a message or add a file first."); return; }
    onSubmit({ text, file });
  }

  return (
    <div className="uploader">
      <textarea
        value={text} onChange={(e) => setText(e.target.value)} disabled={disabled}
        placeholder="Paste the SMS, email or call transcript here…"
        rows={5}
      />
      <div
        className={`drop ${drag ? "drag" : ""} ${file ? "has" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files?.[0]); }}
        onClick={() => input.current?.click()}
        role="button" tabIndex={0}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && input.current?.click()}
      >
        <input ref={input} type="file" hidden accept="image/*,audio/*,video/mp4,.txt,.eml"
          onChange={(e) => pick(e.target.files?.[0])} />
        {file ? (
          <span>📎 {file.name} <button className="link" onClick={(e) => { e.stopPropagation(); setFile(null); }}>remove</button></span>
        ) : (
          <span>Drop a screenshot, call recording or email file here, or click to browse</span>
        )}
      </div>
      <div className="row">
        <button className={`ghost ${rec ? "recording" : ""}`} onClick={toggleRecord} disabled={disabled}>
          {rec ? `■ Stop recording (${secs}s)` : "🎙 Record a call or voice message"}
        </button>
        <button className="primary" onClick={go} disabled={disabled}>Scan with Hepsi</button>
      </div>
      {err && <p className="err" role="alert">{err}</p>}
      <p className="tiny">Tip: for a phone call, put it on speaker and record it here. Nothing you upload is stored.</p>
    </div>
  );
}
