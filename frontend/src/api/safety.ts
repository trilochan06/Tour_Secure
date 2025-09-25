const API = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export async function getNearby(lat: number, lng: number, radiusKm = 50) {
  const r = await fetch(`${API}/api/safety-scores/nearby?lat=${lat}&lng=${lng}&radius=${radiusKm}`);
  return r.json();
}
export async function searchArea(q: string) {
  const r = await fetch(`${API}/api/safety-scores/search?q=${encodeURIComponent(q)}`);
  return r.json();
}
export async function getAll() {
  const r = await fetch(`${API}/api/safety-scores`);
  return r.json();
}
