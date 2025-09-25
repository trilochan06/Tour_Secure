import { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE } from "@/lib/api";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

type Entrypoint = "airport" | "hotel" | "checkpost";
type DocType = "passport" | "aadhaar";
type Contact = { name: string; phone: string };

export default function DigitalID() {
  // form state
  const [walletAddress, setWalletAddress] = useState("");
  const [entrypoint, setEntrypoint] = useState<Entrypoint>("airport");
  const [docType, setDocType] = useState<DocType>("passport");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([{ name: "", phone: "" }]);
  const [file, setFile] = useState<File | null>(null);

  // result state
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string>("");
  const [trip, setTrip] = useState<null | { id: string; tokenId: number; validUntil: number }>(null);
  const [qrUrl, setQrUrl] = useState<string>("");

  // try to prefill wallet from MetaMask
  useEffect(() => {
    (async () => {
      try {
        const eth = (window as any).ethereum;
        if (!eth) return;
        const accounts = await eth.request({ method: "eth_requestAccounts" });
        if (accounts?.[0]) setWalletAddress(accounts[0]);
      } catch { /* ignore */ }
    })();
  }, []);

  function updateContact(i: number, key: keyof Contact, val: string) {
    setContacts(list => list.map((c, idx) => (idx === i ? { ...c, [key]: val } : c)));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!walletAddress) return setError("Enter wallet address");
    if (!file) return setError("Attach Aadhaar/Passport file");
    if (!startAt || !endAt) return setError("Pick start & end time");

    try {
      setCreating(true);
      const form = new FormData();
      form.append("walletAddress", walletAddress);
      form.append("entrypoint", entrypoint);
      form.append("docType", docType);
      // send as ISO (backend expects ISO strings)
      form.append("startAt", new Date(startAt).toISOString());
      form.append("endAt", new Date(endAt).toISOString());
      form.append("emergencyContacts", JSON.stringify(contacts.filter(c => c.name || c.phone)));
      form.append("document", file);

      const { data } = await axios.post(`${API_BASE}/digital-id/trips`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (!data?.ok) throw new Error(data?.error || "Failed to create");
      setTrip({ id: data.id, tokenId: data.tokenId, validUntil: data.validUntil });
      setQrUrl(""); // reset QR until user clicks
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || "Unknown error");
    } finally {
      setCreating(false);
    }
  }

  function handleShowQR() {
    if (!trip?.id) return;
    // use a cache-buster so the <img> refreshes if clicked again
    setQrUrl(`${API_BASE}/digital-id/trips/${trip.id}/qr?ts=${Date.now()}`);
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      <h1 className="text-2xl font-bold">Digital ID</h1>

      <Card>
        <CardHeader title="Create a Digital Trip ID" />
        <CardBody>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Entrypoint */}
            <label className="grid gap-2">
              <span className="text-sm text-neutral-600">Entrypoint</span>
              <select
                className="border rounded px-3 py-2"
                value={entrypoint}
                onChange={(e) => setEntrypoint(e.target.value as Entrypoint)}
              >
                <option value="airport">Airport</option>
                <option value="hotel">Hotel</option>
                <option value="checkpost">Checkpost</option>
              </select>
            </label>

            {/* DocType */}
            <label className="grid gap-2">
              <span className="text-sm text-neutral-600">Document Type</span>
              <select
                className="border rounded px-3 py-2"
                value={docType}
                onChange={(e) => setDocType(e.target.value as DocType)}
              >
                <option value="passport">Passport</option>
                <option value="aadhaar">Aadhaar</option>
              </select>
            </label>

            {/* Start / End */}
            <label className="grid gap-2">
              <span className="text-sm text-neutral-600">Start (local)</span>
              <Input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} />
            </label>
            <label className="grid gap-2">
              <span className="text-sm text-neutral-600">End (local)</span>
              <Input type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} />
            </label>

            {/* Wallet */}
            <label className="grid gap-2 md:col-span-2">
              <span className="text-sm text-neutral-600">Wallet Address</span>
              <Input
                placeholder="0x..."
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
              />
            </label>

            {/* File */}
            <label className="grid gap-2 md:col-span-2">
              <span className="text-sm text-neutral-600">Aadhaar/Passport File</span>
              <Input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              <span className="text-xs text-neutral-500">
                Keep it under 5 MB (the backend rejects larger files).
              </span>
            </label>

            {/* Emergency contacts */}
            <div className="md:col-span-2">
              <div className="text-sm font-semibold mb-2">Emergency Contacts</div>
              <div className="grid gap-3">
                {contacts.map((c, i) => (
                  <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Input
                      placeholder="Name"
                      value={c.name}
                      onChange={(e) => updateContact(i, "name", e.target.value)}
                    />
                    <Input
                      placeholder="Phone"
                      value={c.phone}
                      onChange={(e) => updateContact(i, "phone", e.target.value)}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-3 flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setContacts((cs) => [...cs, { name: "", phone: "" }])}
                >
                  Add Contact
                </Button>
                <Button type="submit" disabled={creating}>
                  {creating ? "Creating…" : "Create Digital ID"}
                </Button>
              </div>

              {error && <div className="mt-3 text-sm text-red-600">{error}</div>}
            </div>
          </form>
        </CardBody>
      </Card>

      {/* Result */}
      {trip && (
        <Card>
          <CardHeader title="Digital ID Created" />
          <CardBody>
            <div className="text-sm grid gap-1">
              <div><b>Trip ID:</b> {trip.id}</div>
              <div><b>Token ID:</b> {trip.tokenId}</div>
              <div><b>Valid Until:</b> {new Date(trip.validUntil * 1000).toLocaleString()}</div>
            </div>

            <div className="mt-4 flex gap-3">
              <Button onClick={handleShowQR}>Show QR Code</Button>
              <a
                className="underline text-sm"
                href={`${API_BASE}/digital-id/trips/${trip.id}`}
                target="_blank"
              >
                View Trip JSON
              </a>
            </div>

            {qrUrl && (
              <div className="mt-4">
                <img
                  src={qrUrl}
                  alt="Trip QR"
                  className="w-64 h-64 border rounded bg-white"
                />
                <div className="text-xs text-neutral-500 mt-2">
                  QR is time-bound. It becomes invalid when the trip ends.
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      )}
    </div>
  );
}
