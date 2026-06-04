// ─── DAILY LOG & TASKS SERVICE ────────────────────────────────────
import { supabase } from '../lib/supabase'

const today = () => new Date().toISOString().split('T')[0]

// ── TASKS ──────────────────────────────────────────────────────────

export const TASK_DEFINITIONS = [
  { key: 'glucose_morning', time: '07:00', icon: '📊', xp: 10,
    nl: 'Ochtendbloedsuiker meten', en: 'Measure morning blood sugar',
    fr: 'Mesurer la glycémie du matin', de: 'Morgens Blutzucker messen' },
  { key: 'eat_window_open', time: '11:00', icon: '🥗', xp: 15,
    nl: 'Eetvenster openen (laag GI)', en: 'Open eating window (low GI)',
    fr: 'Ouvrir la fenêtre alimentaire', de: 'Essensfenster öffnen' },
  { key: 'walk_after_lunch', time: '13:00', icon: '🚶', xp: 20,
    nl: '10 min wandelen na lunch', en: '10 min walk after lunch',
    fr: '10 min de marche après déjeuner', de: '10 Min. nach Mittagessen gehen' },
  { key: 'movement_block', time: '16:00', icon: '🏃', xp: 25,
    nl: 'Bewegingsblok (20 min)', en: 'Movement block (20 min)',
    fr: 'Bloc de mouvement (20 min)', de: 'Bewegungsblock (20 Min.)' },
  { key: 'eat_window_close', time: '19:00', icon: '⏱️', xp: 10,
    nl: 'Eetvenster sluiten', en: 'Close eating window',
    fr: 'Fermer la fenêtre alimentaire', de: 'Essensfenster schließen' },
  { key: 'evening_reflection', time: '21:00', icon: '📝', xp: 10,
    nl: 'Avondreflectie', en: 'Evening reflection',
    fr: 'Réflexion du soir', de: 'Abendreflexion' },
]

// Load today's tasks (create defaults if first visit today)
export async function loadTodayTasks(userId) {
  const date = today()

  // Try to load existing
  const { data, error } = await supabase
    .from('daily_tasks')
    .select('*')
    .eq('user_id', userId)
    .eq('log_date', date)

  if (error) return { tasks: getDefaultTasks(), error }

  // First time today — insert defaults
  if (!data || data.length === 0) {
    const defaults = TASK_DEFINITIONS.map(t => ({
      user_id:  userId,
      log_date: date,
      task_key: t.key,
      done:     false,
      xp:       t.xp,
    }))
    await supabase.from('daily_tasks').insert(defaults)
    return { tasks: getDefaultTasks(), error: null }
  }

  // Merge DB state with definitions
  return {
    tasks: TASK_DEFINITIONS.map(def => ({
      ...def,
      id:      data.find(d => d.task_key === def.key)?.id,
      done:    data.find(d => d.task_key === def.key)?.done || false,
      done_at: data.find(d => d.task_key === def.key)?.done_at,
    })),
    error: null,
  }
}

// Toggle a task done/undone
export async function toggleTask(userId, taskKey, currentDone, xp) {
  const date    = today()
  const newDone = !currentDone

  const { error } = await supabase
    .from('daily_tasks')
    .update({
      done:    newDone,
      done_at: newDone ? new Date().toISOString() : null,
    })
    .eq('user_id', userId)
    .eq('log_date', date)
    .eq('task_key', taskKey)

  if (!error) {
    // Update XP + daily log
    await updateDailyLog(userId, taskKey, newDone, xp)
    // Update streak on first completion of the day
    if (newDone) await updateStreak(userId)
  }

  return { error }
}

function getDefaultTasks() {
  return TASK_DEFINITIONS.map(t => ({ ...t, done: false }))
}

// ── DAILY LOG ──────────────────────────────────────────────────────

async function updateDailyLog(userId, taskKey, done, xp) {
  const date = today()
  const xpDelta = done ? xp : -xp

  // Upsert log for today
  await supabase.from('daily_logs').upsert({
    user_id:  userId,
    log_date: date,
  }, { onConflict: 'user_id,log_date', ignoreDuplicates: true })

  // Count completed tasks
  const { count } = await supabase
    .from('daily_tasks')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('log_date', date)
    .eq('done', true)

  // Update log
  await supabase.from('daily_logs')
    .update({ tasks_completed: count || 0 })
    .eq('user_id', userId)
    .eq('log_date', date)

  // Update XP on profile
  await supabase.rpc('increment_xp', { p_user_id: userId, p_amount: xpDelta })
}

// Log glucose reading
export async function logGlucose(userId, type, value) {
  const date  = today()
  const field = type === 'morning' ? 'glucose_morning' : 'glucose_evening'

  await supabase.from('daily_logs').upsert({
    user_id:  userId,
    log_date: date,
    [field]:  value,
  }, { onConflict: 'user_id,log_date' })
}

// Load last 7 days of logs (for weekly insight)
export async function loadWeekLogs(userId) {
  const { data, error } = await supabase
    .from('daily_logs')
    .select('*')
    .eq('user_id', userId)
    .gte('log_date', getDateDaysAgo(7))
    .order('log_date', { ascending: false })

  return { logs: data || [], error }
}

// ── STREAK ────────────────────────────────────────────────────────

async function updateStreak(userId) {
  // Call the DB function we created in schema
  await supabase.rpc('update_streak', { p_user_id: userId })
}

// ── HELPERS ──────────────────────────────────────────────────────

function getDateDaysAgo(days) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().split('T')[0]
}
