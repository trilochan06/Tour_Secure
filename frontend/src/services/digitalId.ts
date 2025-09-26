import { http } from "@/lib/http";

export async function getMyDigitalId() {
  const { data } = await http.get("/digital-id/me");
  return data?.digitalId || null;
}

export async function createDigitalId(input: {
  entrypoint?: string | null;
  docType?: string | null;
  startAt: string; // ISO
  endAt: string;   // ISO
}) {
  const { data } = await http.post("/digital-id/create", input);
  return data?.digitalId || null;
}

export async function revokeMyDigitalId() {
  const { data } = await http.post("/digital-id/revoke", {});
  return data?.ok === true;
}

export async function refreshQr(digitalIdId: string) {
  const { data } = await http.post(`/digital-id/${digitalIdId}/refresh-qr`, {});
  return data?.digitalId || null;
}

export async function extendTrip(digitalIdId: string, endAtISO: string) {
  const { data } = await http.post(`/digital-id/${digitalIdId}/extend`, { endAt: endAtISO });
  return data?.digitalId || null;
}

export async function uploadDocument(digitalIdId: string, file: File) {
  const form = new FormData();
  form.append("document", file);
  const { data } = await http.post(`/digital-id/${digitalIdId}/upload`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data?.digitalId || null;
}