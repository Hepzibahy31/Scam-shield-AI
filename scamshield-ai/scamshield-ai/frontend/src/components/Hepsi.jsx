import { useEffect, useState } from "react";

// Hepsi: a hand-drawn SVG guardian. mood: happy | think | alert | safe | worried
// The mouth opens and closes while `talking` is true (lip-sync feel).
export default function Hepsi({ mood = "happy", talking = false, waving = false }) {
  const [open, setOpen] = useState(0);

  useEffect(() => {
    if (!talking) { setOpen(0); return; }
    const id = setInterval(() => setOpen(Math.random() * 0.9 + 0.1), 120);
    return () => clearInterval(id);
  }, [talking]);

  const smile = { happy: 13, safe: 16, think: 2, alert: -7, worried: -10 }[mood];
  const w = mood === "safe" ? 21 : 17;
  const o = open * 20;
  const mouth = `M${150 - w} 192 Q150 ${192 + smile} ${150 + w} 192 Q150 ${192 + smile + o + (talking ? 4 : 0)} ${150 - w} 192 Z`;
  const browTilt = { happy: 0, safe: -3, think: -6, alert: 10, worried: -10 }[mood];
  const accent = { alert: "#FF5C7A", worried: "#FFC24D", safe: "#3DF2C4" }[mood] || "#8B6CFF";

  return (
    <svg className={`hepsi ${talking ? "talking" : ""} ${mood}`} viewBox="0 0 300 360" role="img" aria-label="Hepsi, your AI guardian">
      <defs>
        <linearGradient id="hair" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FF6FB5" /><stop offset="1" stopColor="#7B5CFF" />
        </linearGradient>
        <linearGradient id="suit" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2B2260" /><stop offset="1" stopColor="#18123F" />
        </linearGradient>
        <radialGradient id="aura" cx="50%" cy="45%" r="55%">
          <stop offset="0" stopColor={accent} stopOpacity=".55" /><stop offset="1" stopColor={accent} stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx="150" cy="170" r="150" fill="url(#aura)" className="aura" />

      <g className="bob">
        {/* back hair */}
        <path d="M82 150 C70 70 120 28 150 28 C190 28 232 70 218 150 C226 220 214 262 200 280 L100 280 C86 262 74 220 82 150Z" fill="url(#hair)" />
        {/* shoulders */}
        <path d="M40 360 C44 296 86 268 150 268 C214 268 256 296 260 360Z" fill="url(#suit)" />
        <path d="M118 270 L150 312 L182 270" fill="none" stroke={accent} strokeWidth="3" strokeLinecap="round" />
        {/* shield badge */}
        <g transform="translate(196 306)">
          <path d="M0 0 L16 5 V18 C16 28 8 34 0 38 C-8 34 -16 28 -16 18 V5Z" fill="#140F2E" stroke={accent} strokeWidth="2.5" />
          <path d="M-6 17 L-1 22 L8 10" fill="none" stroke={accent} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </g>
        {/* neck */}
        <rect x="132" y="226" width="36" height="46" rx="14" fill="#E9B896" />
        {/* face */}
        <ellipse cx="150" cy="160" rx="64" ry="72" fill="#F6CFAE" />
        {/* fringe */}
        <path d="M84 150 C84 84 126 56 154 56 C196 56 220 96 216 150 C200 120 176 100 150 92 C124 106 100 122 84 150Z" fill="url(#hair)" />
        <path d="M96 118 C110 96 128 88 146 86" fill="none" stroke="#fff" strokeOpacity=".35" strokeWidth="3" strokeLinecap="round" />
        {/* headset */}
        <path d="M84 150 C80 110 96 70 150 66 C204 70 220 110 216 150" fill="none" stroke={accent} strokeWidth="5" strokeLinecap="round" opacity=".9" />
        <rect x="72" y="140" width="16" height="34" rx="8" fill={accent} />
        <rect x="212" y="140" width="16" height="34" rx="8" fill={accent} />
        <path d="M80 172 C84 200 110 212 128 206" fill="none" stroke={accent} strokeWidth="4" strokeLinecap="round" />
        <circle cx="130" cy="206" r="5" fill={accent} />

        {/* brows */}
        <g stroke="#3B2A5E" strokeWidth="4" strokeLinecap="round">
          <line x1="112" y1="130" x2="138" y2={130 - browTilt / 2} transform={`rotate(${-browTilt} 125 130)`} />
          <line x1="162" y1={130 - browTilt / 2} x2="188" y2="130" transform={`rotate(${browTilt} 175 130)`} />
        </g>
        {/* eyes */}
        <g className="eyes">
          <ellipse cx="126" cy="154" rx="11" ry="13" fill="#2A1B4D" />
          <ellipse cx="174" cy="154" rx="11" ry="13" fill="#2A1B4D" />
          <circle cx="130" cy="149" r="4" fill="#fff" /><circle cx="178" cy="149" r="4" fill="#fff" />
          <circle cx="122" cy="159" r="2" fill="#fff" opacity=".8" /><circle cx="170" cy="159" r="2" fill="#fff" opacity=".8" />
        </g>
        {/* blush + nose */}
        <circle cx="106" cy="184" r="10" fill="#FF8FA8" opacity={mood === "alert" ? 0.15 : 0.45} />
        <circle cx="194" cy="184" r="10" fill="#FF8FA8" opacity={mood === "alert" ? 0.15 : 0.45} />
        <path d="M148 172 Q150 178 153 172" fill="none" stroke="#C98F6B" strokeWidth="2.5" strokeLinecap="round" />
        {/* mouth */}
        <path d={mouth} fill={open > 0.05 ? "#8E2646" : "none"} stroke="#8E2646" strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round" />
        {open > 0.45 && <ellipse cx="150" cy={199 + o / 4} rx="9" ry="3.5" fill="#FF7B9C" />}
      </g>

      {/* waving hand */}
      {waving && (
        <g className="wave" transform="translate(238 252)">
          <rect x="-12" y="-6" width="26" height="46" rx="13" fill="#F6CFAE" />
          <rect x="-6" y="-26" width="8" height="26" rx="4" fill="#F6CFAE" />
          <rect x="4" y="-30" width="8" height="30" rx="4" fill="#F6CFAE" />
          <rect x="-16" y="-14" width="8" height="22" rx="4" fill="#F6CFAE" />
        </g>
      )}
    </svg>
  );
}
