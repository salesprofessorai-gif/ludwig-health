// ─── SCAN HISTORY HOOK ────────────────────────────────────────────
import { useState, useEffect, useCallback } from 'react'
import { loadScanHistory } from '../services/scanner'

export function useScanHistory(userId) {
  const [scans,   setScans]   = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!userId) return
    const { scans } = await loadScanHistory(userId, 5)
    setScans(scans)
    setLoading(false)
  }, [userId])

  useEffect(() => { fetch() }, [fetch])

  const addScan = (scan) => setScans(prev => [scan, ...prev].slice(0, 5))

  return { scans, loading, refetch: fetch, addScan }
}
