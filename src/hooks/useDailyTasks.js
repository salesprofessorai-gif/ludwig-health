// ─── DAILY TASKS HOOK ─────────────────────────────────────────────
import { useState, useEffect, useCallback } from 'react'
import { loadTodayTasks, toggleTask } from '../services/daily'

export function useDailyTasks(userId) {
  const [tasks,   setTasks]   = useState([])
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)

  const fetch = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    const { tasks, error } = await loadTodayTasks(userId)
    if (!error) setTasks(tasks)
    setLoading(false)
  }, [userId])

  useEffect(() => { fetch() }, [fetch])

  const toggle = async (taskKey) => {
    const task = tasks.find(t => t.key === taskKey)
    if (!task || saving) return

    // Optimistic update
    setTasks(prev => prev.map(t =>
      t.key === taskKey ? { ...t, done: !t.done } : t
    ))

    setSaving(true)
    const { error } = await toggleTask(userId, taskKey, task.done, task.xp)
    if (error) {
      // Revert on error
      setTasks(prev => prev.map(t =>
        t.key === taskKey ? { ...t, done: task.done } : t
      ))
    }
    setSaving(false)
  }

  const completed = tasks.filter(t => t.done).length
  const total     = tasks.length
  const pct       = total ? Math.round((completed / total) * 100) : 0

  return { tasks, loading, toggle, completed, total, pct }
}
