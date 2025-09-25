// frontend/src/lib/api.ts
export const API_URL = import.meta.env.VITE_API_URL as string;
// Back-compat for pages that import { API_BASE }
export const API_BASE = API_URL;

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try { const j = await res.json(); msg = j.error || j.message || msg; } catch {}
    throw new Error(msg);
  }
  return res.json();
}

export const get = async <T>(p: string) => handle<T>(await fetch(`${API_URL}${p}`));
export const post = async <T, B=unknown>(p: string, body?: B) =>
  handle<T>(await fetch(`${API_URL}${p}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  }));
