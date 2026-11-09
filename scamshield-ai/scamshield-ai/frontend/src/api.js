export async function analyze({ text, file }) {
  const form = new FormData();
  form.append("text", text || "");
  if (file) form.append("file", file, file.name || "upload");
  let res;
  try {
    res = await fetch("/api/analyze", { method: "POST", body: form });
  } catch {
    throw new Error("I can't reach the backend. Start it with: uvicorn main:app --reload --port 8000");
  }
  if (!res.ok) {
    let msg = "Something went wrong.";
    try { msg = (await res.json()).detail || msg; } catch { /* ignore */ }
    throw new Error(msg);
  }
  return res.json();
}
