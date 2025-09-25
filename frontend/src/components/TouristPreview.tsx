import { useEffect, useState } from "react";
import { readTourist } from "@/lib/blockchain";

export default function TouristPreview() {
  const [data, setData] = useState<any>(null);
  const tokenId = 1; // the one you issued

  useEffect(() => {
    (async () => setData(await readTourist(tokenId)))();
  }, []);

  if (!data) return <div className="p-4">Loading…</div>;
  return (
    <div className="p-4 rounded-xl shadow grid gap-2 bg-white/60 dark:bg-zinc-900/60">
      <div><b>Token</b>: {tokenId}</div>
      <div><b>Valid</b>: {String(data.valid)}</div>
      <div><b>Emergency</b>: {String(data.info.emergencyFlag)}</div>
      <div><b>Expires</b>: {new Date(Number(data.info.validUntil) * 1000).toLocaleString()}</div>
    </div>
  );
}
