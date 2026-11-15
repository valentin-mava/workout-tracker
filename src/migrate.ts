import type { AppData, Exercise, LogEntry, Tool } from './types'

export const emptyData = (): AppData => ({
  version: 2,
  workouts: [],
  logs: [],
  sportLogs: [],
  sportPresets: [],
  notes: [],
  activities: [],
  freeDraft: null,
  strava: null,
})

type Metric = 'sets' | 'reps' | 'weight' | 'time'
interface V1Values {
  sets?: number
  reps?: number
  weight?: number
  time?: number
  track: Metric[]
}
interface V1Data {
  workouts: { id: string; name: string; exercises: (V1Values & { id: string; name: string; note?: string })[] }[]
  sessions: { id: string; workoutId: string; workoutName: string; date: string; durationMinutes: number; entries: (V1Values & { exerciseId: string; exerciseName: string; done: boolean })[] }[]
}

/** v1 kannte kein Tool und trackte Werte frei; daraus Sets × Reps/Sekunden + kg machen */
function fromV1(v: V1Values) {
  const timed = v.track.includes('time') && !v.track.includes('reps')
  const tool: Tool | undefined = v.track.includes('weight') ? undefined : 'bodyweight'
  return {
    tool,
    sets: v.track.includes('sets') ? (v.sets ?? 1) : 1,
    reps: (timed ? v.time : v.reps) ?? 0,
    unit: timed ? ('sec' as const) : ('reps' as const),
    weight: v.track.includes('weight') ? v.weight : undefined,
  }
}

/** Bringt gespeicherte Daten jeder Version auf den aktuellen Stand */
export function migrate(raw: unknown): AppData | null {
  const d = raw as Partial<AppData> & Partial<V1Data> & { version?: number }
  if (!d || typeof d !== 'object' || !Array.isArray(d.workouts)) return null
  if (d.version === 2) return { ...emptyData(), ...d } as AppData
  if (!Array.isArray(d.sessions)) return null

  const v1 = d as V1Data
  return {
    ...emptyData(),
    workouts: v1.workouts.map((w) => ({
      id: w.id,
      name: w.name,
      exercises: w.exercises.map((e): Exercise => ({ id: e.id, name: e.name, note: e.note, ...fromV1(e) })),
    })),
    logs: v1.sessions.map((s) => {
      const done = s.entries.filter((e) => e.done)
      return {
        id: s.id,
        workoutId: s.workoutId,
        workoutName: s.workoutName,
        date: s.date,
        durationMinutes: s.durationMinutes,
        entries: (done.length ? done : s.entries).map((e): LogEntry => ({ exerciseId: e.exerciseId, name: e.exerciseName, ...fromV1(e) })),
      }
    }),
  }
}
