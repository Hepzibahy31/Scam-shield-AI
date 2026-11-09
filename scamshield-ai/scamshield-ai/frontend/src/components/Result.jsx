import ScoreMeter from "./ScoreMeter.jsx";

const TITLE = { scam: "This is a scam", suspicious: "This looks suspicious", safe: "This looks safe" };
const ICON = { scam: "⚠", suspicious: "?", safe: "✓" };

function Highlighted({ text, flags }) {
  const phrases = flags.map((f) => f.text).filter((t) => t && t.length > 2 && text.toLowerCase().includes(t.toLowerCase()));
  if (!text) return null;
  if (!phrases.length) return <>{text}</>;
  const esc = phrases.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const parts = text.split(new RegExp(`(${esc.join("|")})`, "gi"));
  return parts.map((part, i) =>
    phrases.some((p) => p.toLowerCase() === part.toLowerCase()) ? <mark key={i}>{part}</mark> : <span key={i}>{part}</span>
  );
}

function downloadCard(r) {
  const c = document.createElement("canvas");
  c.width = c.height = 1080;
  const g = c.getContext("2d");
  const col = { safe: "#3DF2C4", suspicious: "#FFC24D", scam: "#FF5C7A" }[r.verdict];
  const bg = g.createLinearGradient(0, 0, 1080, 1080);
  bg.addColorStop(0, "#140F2E"); bg.addColorStop(1, "#2B1B6B");
  g.fillStyle = bg; g.fillRect(0, 0, 1080, 1080);
  g.fillStyle = col; g.globalAlpha = 0.18; g.beginPath(); g.arc(540, 430, 330, 0, 7); g.fill(); g.globalAlpha = 1;
  g.textAlign = "center"; g.fillStyle = "#fff";
  g.font = "700 46px sans-serif"; g.fillText("ScamShield AI · checked by Hepsi", 540, 110);
  g.fillStyle = col; g.font = "800 220px sans-serif"; g.fillText(`${r.score}%`, 540, 470);
  g.fillStyle = "#fff"; g.font = "700 74px sans-serif"; g.fillText(TITLE[r.verdict], 540, 600);
  g.font = "400 38px sans-serif"; g.fillStyle = "#cfc8ff";
  const words = (r.summary || "").split(" "); let line = ""; let y = 690;
  for (const w of words) {
    if (g.measureText(line + w).width > 860) { g.fillText(line, 540, y); line = ""; y += 52; }
    line += w + " ";
  }
  g.fillText(line, 540, y);
  g.fillStyle = col; g.font = "700 40px sans-serif";
  g.fillText("Never share your OTP. Check before you click.", 540, 980);
  const a = document.createElement("a");
  a.download = "scamshield-result.png"; a.href = c.toDataURL("image/png"); a.click();
}

export default function Result({ r, onAgain, onReplay }) {
  return (
    <section className={`result ${r.verdict}`}>
      <div className="result-head">
        <ScoreMeter score={r.score} verdict={r.verdict} />
        <div>
          <h2><span className="badge">{ICON[r.verdict]}</span> {TITLE[r.verdict]}</h2>
          <p className="summary">{r.summary}</p>
          {r.scam_type && r.scam_type !== "None" && <p className="type">Type: {r.scam_type}</p>}
        </div>
      </div>

      {r.red_flags.length > 0 && (
        <div className="block">
          <h3>Red flags Hepsi found</h3>
          <ul className="flags">
            {r.red_flags.map((f, i) => (
              <li key={i}><q>{f.text}</q><span>{f.reason}</span></li>
            ))}
          </ul>
        </div>
      )}

      {r.extracted_text && (
        <div className="block">
          <h3>What I read ({r.source})</h3>
          <p className="read"><Highlighted text={r.extracted_text} flags={r.red_flags} /></p>
        </div>
      )}

      <div className="block">
        <h3>What to do now</h3>
        <ol className="steps">{r.next_steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
      </div>

      <div className="row end">
        <span className="tiny engine">Engine: {r.engine}. AI can be wrong, so confirm with the official source.</span>
        <button className="ghost" onClick={onReplay}>🔊 Hear Hepsi again</button>
        <button className="ghost" onClick={() => downloadCard(r)}>Download warning card</button>
        <button className="primary" onClick={onAgain}>Check another</button>
      </div>
    </section>
  );
}
