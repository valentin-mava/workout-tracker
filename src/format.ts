import type { Activity, ActivityType, AppData, Exercise, LogEntry, Tool, Workout } from './types'

export const TOOL_LABEL: Record<Tool, string> = {
  bodyweight: 'Bodyweight',
  dumbbell: 'Kurzhantel',
  barbell: 'Langhantel',
  machine: 'Maschine',
  cable: 'Kabel',
  kettlebell: 'Kettlebell',
}

export const ACTIVITY_LABEL: Record<ActivityType, string> = {
  run: 'Laufen',
  ride: 'Rad',
  swim: 'Schwimmen',
  hike: 'Wandern',
  other: 'Sonstiges',
}

export const SPORTS = ['Mobility', 'Stretching', 'Gymnastik', 'Yoga', 'Padel', 'Wandern']

const DAY = 86_400_000

export const hasWeight = (e: Pick<Exercise, 'tool' | 'weight'>) => e.tool !== 'bodyweight' && e.weight != null

export const formatKg = (kg: number) => `${kg.toLocaleString('de-DE')} kg`

/** "4 × 8" bzw. "3 × 30 s" */
export const setsReps = (e: Pick<Exercise, 'sets' | 'reps' | 'unit'>) => `${e.sets} × ${e.reps}${e.unit === 'sec' ? ' s' : ''}`

export const exerciseSummary = (e: Pick<Exercise, 'sets' | 'reps' | 'unit' | 'tool' | 'weight'>) =>
  setsReps(e) + (hasWeight(e) ? ` · ${formatKg(e.weight!)}` : '')

/** Minuten als "52 min" bzw. "1:20 h" */
export function formatMinutes(min: number) {
  if (min < 60) return `${min} min`
  return `${Math.floor(min / 60)}:${String(min % 60).padStart(2, '0')} h`
}

/** Summe in Stunden als "4:35" */
export const formatHours = (min: number) => `${Math.floor(min / 60)}:${String(Math.round(min % 60)).padStart(2, '0')}`

export function formatKm(m: number) {
  return (m / 1000).toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
}

export function formatSec(sec: number) {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = Math.round(sec % 60)
  return h ? `${h}:${String(m).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`
}

/** Pace (min/km) fürs Laufen und Wandern, sonst km/h */
export function speed(a: Activity) {
  if (!a.distanceM || !a.movingSec) return { value: '–', unit: '' }
  if (a.type === 'run') return { value: formatSec(a.movingSec / (a.distanceM / 1000)), unit: 'min/km' }
  if (a.type === 'swim') return { value: formatSec(a.movingSec / (a.distanceM / 100)), unit: 'min/100 m' }
  return { value: ((a.distanceM / 1000) / (a.movingSec / 3600)).toLocaleString('de-DE', { maximumFractionDigits: 1 }), unit: 'km/h' }
}

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())

export function relativeDay(iso: string) {
  const diff = Math.round((startOfDay(new Date()).getTime() - startOfDay(new Date(iso)).getTime()) / DAY)
  if (diff <= 0) return 'heute'
  if (diff === 1) return 'gestern'
  if (diff < 7) return `vor ${diff} Tagen`
  if (diff < 14) return 'vor 1 Woche'
  if (diff < 60) return `vor ${Math.floor(diff / 7)} Wochen`
  return new Date(iso).toLocaleDateString('de-DE', { day: 'numeric', month: 'short', year: 'numeric' })
}

export const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' })

export const shortTime = (iso: string) => new Date(iso).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })

/** Montag 0:00 der Woche, in der d liegt */
export function weekStart(d: Date) {
  const s = startOfDay(d)
  s.setDate(s.getDate() - ((s.getDay() + 6) % 7))
  return s
}

export function isoWeek(d: Date) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  t.setUTCDate(t.getUTCDate() + 4 - (t.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1))
  return Math.ceil(((t.getTime() - yearStart.getTime()) / DAY + 1) / 7)
}

/** yyyy-mm-dd für <input type="date"> */
export function toDateInput(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Heute → jetziger Zeitpunkt, anderer Tag → 12:00 Uhr an diesem Tag */
export function fromDateInput(value: string) {
  if (value === toDateInput(new Date().toISOString())) return new Date().toISOString()
  const [y, m, d] = value.split('-').map(Number)
  return new Date(y, m - 1, d, 12).toISOString()
}

/** Wie oft ein Workout in den letzten 90 Tagen erledigt wurde */
export function workoutStats(data: AppData, w: Workout) {
  const logs = data.logs.filter((l) => l.workoutId === w.id)
  const since = Date.now() - 90 * DAY
  const recent = logs.filter((l) => new Date(l.date).getTime() >= since).length
  const last = logs.reduce<string | null>((acc, l) => (!acc || l.date > acc ? l.date : acc), null)
  const timed = logs.filter((l) => l.durationMinutes)
  const avg = timed.length ? Math.round(timed.reduce((a, l) => a + l.durationMinutes!, 0) / timed.length) : null
  return { recent, last, avg }
}

export function sortedWorkouts(data: AppData) {
  return data.workouts
    .map((w) => ({ w, s: workoutStats(data, w) }))
    .sort((a, b) => b.s.recent - a.s.recent || (b.s.last ?? '').localeCompare(a.s.last ?? '') || a.w.name.localeCompare(b.w.name))
}

/** Letzter Log-Eintrag dieser Übung, der mindestens `days` Tage alt ist */
export function entryBefore(data: AppData, exerciseId: string, days: number): LogEntry | null {
  const cutoff = Date.now() - days * DAY
  let best: { e: LogEntry; date: string } | null = null
  for (const l of data.logs) {
    if (new Date(l.date).getTime() > cutoff) continue
    const e = l.entries.find((x) => x.exerciseId === exerciseId)
    if (e && (!best || l.date > best.date)) best = { e, date: l.date }
  }
  return best?.e ?? null
}

/** Veränderung gegenüber einem früheren Stand, z. B. "+2,5 kg" oder "+1 Wdh." */
export function progress(now: Exercise, before: LogEntry | null): { text: string; up: boolean } | null {
  if (!before) return null
  if (hasWeight(now) && before.weight != null && now.weight !== before.weight) {
    const d = now.weight! - before.weight
    return { text: `${d > 0 ? '+' : '−'}${formatKg(Math.abs(d))}`, up: d > 0 }
  }
  if (now.unit === before.unit && now.reps !== before.reps) {
    const d = now.reps - before.reps
    return { text: `${d > 0 ? '+' : '−'}${Math.abs(d)} ${now.unit === 'sec' ? 's' : 'Wdh.'}`, up: d > 0 }
  }
  if (now.sets !== before.sets) {
    const d = now.sets - before.sets
    return { text: `${d > 0 ? '+' : '−'}${Math.abs(d)} ${Math.abs(d) === 1 ? 'Satz' : 'Sätze'}`, up: d > 0 }
  }
  return { text: 'gleich', up: false }
}

export type ItemKind = 'gym' | 'cardio' | 'other'

export interface WeekItem {
  id: string
  date: string
  kind: ItemKind
  name: string
  value: string
  minutes: number
  open: string
}

/** Alles, was in der Woche ab `start` passiert ist, chronologisch */
export function weekItems(data: AppData, start: Date): WeekItem[] {
  const from = start.getTime()
  const to = from + 7 * DAY
  const inWeek = (iso: string) => {
    const t = new Date(iso).getTime()
    return t >= from && t < to
  }
  const items: WeekItem[] = [
    ...data.logs.filter((l) => inWeek(l.date)).map((l) => ({
      id: l.id,
      date: l.date,
      kind: 'gym' as const,
      name: l.workoutName,
      value: l.durationMinutes ? formatMinutes(l.durationMinutes) : '–',
      minutes: l.durationMinutes ?? 0,
      open: `log/${l.id}`,
    })),
    ...data.activities.filter((a) => inWeek(a.date)).map((a) => ({
      id: a.id,
      date: a.date,
      kind: 'cardio' as const,
      name: a.name,
      value: a.distanceM ? `${formatKm(a.distanceM)} km` : formatSec(a.movingSec),
      minutes: a.movingSec / 60,
      open: 'cardio',
    })),
    ...data.sportLogs.filter((s) => inWeek(s.date)).map((s) => ({
      id: s.id,
      date: s.date,
      kind: 'other' as const,
      name: s.sport,
      value: `${formatMinutes(s.durationMinutes)} · ${s.intensity}/5`,
      minutes: s.durationMinutes,
      open: `sport/${s.id}`,
    })),
  ]
  return items.sort((a, b) => a.date.localeCompare(b.date))
}

export function weekSummary(data: AppData, start: Date) {
  const items = weekItems(data, start)
  const from = start.getTime()
  const acts = data.activities.filter((a) => {
    const t = new Date(a.date).getTime()
    return t >= from && t < from + 7 * DAY
  })
  return {
    items,
    workouts: items.filter((i) => i.kind === 'gym').length,
    runs: acts.filter((a) => a.type === 'run').length,
    km: acts.reduce((s, a) => s + a.distanceM, 0),
    minutes: items.reduce((s, i) => s + i.minutes, 0),
  }
}
