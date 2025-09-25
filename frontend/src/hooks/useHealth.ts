import { useEffect, useState } from 'react';
import { API_URL } from '@/lib/api';

export function useHealth() {
  const [status, setStatus] = useState('checking…');
  useEffect(() => {
    let alive = true;
    fetch(`${API_URL}/health`)
      .then(r => r.json().catch(() => ({ time: `HTTP ${r.status}` })))
      .then(j => { if (alive) setStatus(`ok (${j.time || 'healthy'})`); })
      .catch(e => { if (alive) setStatus(`error: ${e.message}`); });
    return () => { alive = false; };
  }, []);
  return status;
}
