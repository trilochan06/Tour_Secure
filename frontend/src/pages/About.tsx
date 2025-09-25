export default function About(){
  return (
    <div className="grid gap-6">
      <div className="card">
        <h1 className="text-2xl font-bold mb-2">About</h1>
        <p className="text-sm text-slate-600">
          This demo showcases a smart tourist safety platform with geo-fencing, anomaly detection, e-FIR, and a blockchain ID.
        </p>
      </div>
      <div className="card">
        <h2 className="font-semibold mb-2">Disclaimer</h2>
        <p className="text-sm">This is an MVP for research and demonstration. Do not use in production without review and hardening.</p>
      </div>
    </div>
  )
}
