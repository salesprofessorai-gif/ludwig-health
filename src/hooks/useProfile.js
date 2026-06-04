// ─── PROFILE HOOK ─────────────────────────────────────────────────
import { useState, useEffect, useCallback } from 'react'
import { loadProfile, updateLanguage } from '../services/profile'

export function useProfile(userId) {
  const [profile,  setProfile]  = useState(null)
  const [pleasure, setPleasure] = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)

  const fetch = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    const res = await loadProfile(userId)
    if (res.error) { setError(res.error); setLoading(false); return }
    setProfile(res.profile)
    setPleasure(res.pleasure)
    setLoading(false)
  }, [userId])

  useEffect(() => { fetch() }, [fetch])

  const changeLang = async (lang) => {
    await updateLanguage(userId, lang)
    setProfile(p => ({ ...p, language: lang }))
  }

  return { profile, pleasure, loading, error, refetch: fetch, changeLang }
}
