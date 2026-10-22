import type { AppData, Exercise, Metric, Values, Workout } from './types'

export const METRIC_LABEL: Record<Metric, string> = {
  sets: 'Sätze',
  reps: 'Wdh.',
  weight: 'Gewicht',
  time: 'Zeit',
}

export const STEP: Record<Metric, number> = { sets: 1, reps: 1, weight: 2.5, time: 5 }

export const DEFAULTS: Required<Values> = { sets: 3, reps: 10, weight: 20, time: 30 }

export function formatTime(sec: number) {
  if (sec < 60) return `${sec} s`
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return s ? `${m}:${String(s).padStart(2, '0')} min` : `${m} min`
}

export function formatWeight(kg: number) {
  return `${kg.toLocaleString('de-DE')} kg`
}

/** "3 × 10 · 40 kg" bzw. "2 × 45 s" */
export function summary(v: Values, track: Metric[]) {
  const parts: string[] = []
  const has = (m: Metric) => track.includes(m) && v[m] != null
  let reps = ''
  if (has('reps')) reps = String(v.reps)
  else if (has('time')) reps = formatTime(v.time!)
  if (has('sets') && reps) parts.push(`${v.sets} × ${reps}`)
  else if (has('sets')) parts.push(`${v.sets} Sätze`)
  else if (reps) parts.push(has('reps') ? `${reps} Wdh.` : reps)
  if (has('reps') && has('time')) parts.push(formatTime(v.time!))
  if (has('weight')) parts.push(formatWeight(v.weight!))
  return parts.join(' · ')
}

export function relativeDay(iso: string) {
  const day = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const diff = Math.round((day(new Date()) - day(new Date(iso))) / 86_400_000)
  if (diff <= 0) return 'heute'
  if (diff === 1) return 'gestern'
  if (diff < 7) return `vor ${diff} Tagen`
  if (diff < 14) return 'vor 1 Woche'
  if (diff < 60) return `vor ${Math.floor(diff / 7)} Wochen`
  return new Date(iso).toLocaleDateString('de-DE', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function workoutStats(data: AppData, w: Workout) {
  const sessions = data.sessions.filter((s) => s.workoutId === w.id)
  const last = sessions.reduce<string | null>((acc, s) => (!acc || s.date > acc ? s.date : acc), null)
  const avg = sessions.length
    ? Math.round(sessions.reduce((a, s) => a + s.durationMinutes, 0) / sessions.length)
    : null
  return { count: sessions.length, last, avg }
}

/** Werte des letzten erledigten Eintrags dieser Übung, sonst null */
export function lastValues(data: AppData, ex: Exercise): (Values & { date: string }) | null {
  let best: (Values & { date: string }) | null = null
  for (const s of data.sessions) {
    const e = s.entries.find((e) => e.exerciseId === ex.id && e.done)
    if (e && (!best || s.date > best.date)) best = { sets: e.sets, reps: e.reps, weight: e.weight, time: e.time, date: s.date }
  }
  return best
}
