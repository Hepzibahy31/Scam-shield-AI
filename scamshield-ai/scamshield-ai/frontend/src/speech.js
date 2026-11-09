// Browser text-to-speech helper. Hepsi's voice = a female system voice when one exists.
let cached = null;

function pickVoice() {
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  if (cached && voices.includes(cached)) return cached;
  const prefs = [/zira|samantha|aria|jenny|google uk english female|google us english|female|victoria|karen|moira|tessa/i];
  cached = voices.find((v) => /^en/i.test(v.lang) && prefs[0].test(v.name)) || voices.find((v) => /^en/i.test(v.lang)) || voices[0];
  return cached;
}

export const speechSupported = typeof window !== "undefined" && "speechSynthesis" in window;

export function stopSpeaking() {
  if (speechSupported) window.speechSynthesis.cancel();
}

/** Speak text. Calls onStart/onEnd. Returns a promise that resolves when finished. */
export function speak(text, { onStart, onEnd } = {}) {
  return new Promise((resolve) => {
    if (!speechSupported) { onStart?.(); setTimeout(() => { onEnd?.(); resolve(); }, Math.min(6000, text.length * 55)); return; }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const v = pickVoice();
    if (v) u.voice = v;
    u.pitch = 1.25; u.rate = 1.0; u.volume = 1;
    u.onstart = () => onStart?.();
    const done = () => { onEnd?.(); resolve(); };
    u.onend = done; u.onerror = done;
    window.speechSynthesis.speak(u);
  });
}

if (speechSupported) window.speechSynthesis.onvoiceschanged = () => { cached = null; pickVoice(); };
