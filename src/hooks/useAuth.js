// ─── AUTH HOOK ────────────────────────────────────────────────────
import { useState, useEffect } from 'react'
import { supabase, hasSupabase } from '../lib/supabase'

export function useAuth() {
  const [session, setSession]   = useState(null)
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    if (!hasSupabase) { setLoading(false); return }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setSession(session)
    )

    return () => subscription.unsubscribe()
  }, [])

  return { session, user: session?.user || null, loading }
}
