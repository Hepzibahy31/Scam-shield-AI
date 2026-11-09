import { useEffect, useState } from "react";

const COLORS = { safe: "#3DF2C4", suspicious: "#FFC24D", scam: "#FF5C7A" };

export default function ScoreMeter({ score, verdict }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf, start;
    const tick = (t) => {
      start = start ?? t;
      const p = Math.min(1, (t - start) / 1400);
      setN(Math.round(score * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [score]);

  const R = 78, C = Math.PI * R; // half circle
  const color = COLORS[verdict];
  return (
    <div className="meter" aria-label={`Scam score ${score} out of 100`}>
      <svg viewBox="0 0 200 118">
        <path d="M22 100 A78 78 0 0 1 178 100" fill="none" stroke="rgba(255,255,255,.1)" strokeWidth="16" strokeLinecap="round" />
        <path d="M22 100 A78 78 0 0 1 178 100" fill="none" stroke={color} strokeWidth="16" strokeLinecap="round"
          strokeDasharray={C} strokeDashoffset={C * (1 - n / 100)} style={{ filter: `drop-shadow(0 0 10px ${color})` }} />
      </svg>
      <div className="meter-num" style={{ color }}>{n}<small>%</small></div>
      <div className="meter-cap">scam score</div>
    </div>
  );
}
