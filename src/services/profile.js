// ─── PROFILE SERVICE ──────────────────────────────────────────────
import { supabase } from '../lib/supabase'

// Save full onboarding result to Supabase
export async function saveOnboarding(userId, data) {
  const today = new Date().toISOString().split('T')[0]

  // 1. Upsert profile
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id:               userId,
      first_name:       data.name,
      language:         data.lang || 'nl',
      uses_medication:  data.usesMedication || false,
      fasting_pattern:  data.pattern || '16-8',
      eat_start:        getEatStart(data.pattern),
      eat_end:          getEatEnd(data.pattern),
      onboarding_done:  true,
      streak:           0,
      last_active_date: today,
    }, { onConflict: 'id' })

  if (profileError) return { error: profileError }

  // 2. Upsert pleasure profile
  const { error: pleasureError } = await supabase
    .from('pleasure_profiles')
    .upsert({
      user_id:        userId,
      enjoy_presets:  data.enjoy        || [],
      enjoy_custom:   data.customEnjoy  || [],
      ritual_presets: data.rituals      || [],
      ritual_custom:  data.customRituals|| [],
      anything_else:  data.anythingElse || [],
    }, { onConflict: 'user_id' })

  return { error: pleasureError }
}

// Load profile + pleasure profile
export async function loadProfile(userId) {
  const [profileRes, pleasureRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    supabase.from('pleasure_profiles').select('*').eq('user_id', userId).single(),
  ])

  if (profileRes.error) return { error: profileRes.error }

  return {
    profile:  profileRes.data,
    pleasure: pleasureRes.data || null,
    error:    null,
  }
}

// Update language preference
export async function updateLanguage(userId, lang) {
  return supabase.from('profiles').update({ language: lang }).eq('id', userId)
}

// Update fasting pattern
export async function updatePattern(userId, pattern) {
  return supabase.from('profiles').update({
    fasting_pattern: pattern,
    eat_start:       getEatStart(pattern),
    eat_end:         getEatEnd(pattern),
  }).eq('id', userId)
}

function getEatStart(pattern) {
  return pattern === '12-12' ? 7 : pattern === '18-6' ? 12 : 11
}
function getEatEnd(pattern) {
  return pattern === '12-12' ? 19 : pattern === '18-6' ? 18 : 19
}
