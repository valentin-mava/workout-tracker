export type Tool = 'bodyweight' | 'dumbbell' | 'barbell' | 'machine' | 'cable' | 'kettlebell'

export const TOOLS: Tool[] = ['bodyweight', 'dumbbell', 'barbell', 'machine', 'cable', 'kettlebell']

export interface Exercise {
  id: string
  name: string
  /** fehlt bei aus v1 übernommenen Übungen, bis du es setzt */
  tool?: Tool
  sets: number
  reps: number
  /** "reps" = Wiederholungen, "sec" = Sekunden pro Satz (z. B. Plank) */
  unit: 'reps' | 'sec'
  /** kg; bei Bodyweight ohne Bedeutung */
  weight?: number
  note?: string
}

export interface Workout {
  id: string
  name: string
  exercises: Exercise[]
}

/** Momentaufnahme einer Übung beim Abhaken */
export type LogEntry = Omit<Exercise, 'id' | 'note'> & { exerciseId: string }

/** Ein erledigtes Workout */
export interface WorkoutLog {
  id: string
  /** null bei freiem Training, das nicht als Workout gespeichert wurde */
  workoutId: string | null
  workoutName: string
  /** ISO-Zeitpunkt */
  date: string
  durationMinutes?: number
  entries: LogEntry[]
}

export interface SportLog {
  id: string
  sport: string
  date: string
  durationMinutes: number
  /** 1–5 */
  intensity: number
  note?: string
  /** aus Strava übernommen; die Intensität ergänzt du selbst */
  source?: 'strava'
}

/** Gespeicherte Vorlage für Other Sports, z. B. "Mobility Flow 20 min" */
export interface SportPreset {
  id: string
  sport: string
  durationMinutes: number
  intensity: number
  note?: string
}

export interface Note {
  id: string
  title: string
  body: string
  createdAt: string
  updatedAt: string
}

export type ActivityType = 'run' | 'ride' | 'swim' | 'hike' | 'other'

/** Aus Strava übernommene Aktivität */
export interface Activity {
  id: string
  type: ActivityType
  name: string
  date: string
  distanceM: number
  movingSec: number
  avgHr?: number
  elevM?: number
}

export interface StravaLink {
  /** Zufälliger Geräteschlüssel, unter dem der Worker die Strava-Tokens ablegt */
  key: string
  connected: boolean
  athlete?: string
  lastSync?: string
}

export interface FreeDraft {
  name: string
  startedAt: string
  exercises: Exercise[]
}

export interface AppData {
  version: 2
  workouts: Workout[]
  logs: WorkoutLog[]
  sportLogs: SportLog[]
  sportPresets: SportPreset[]
  notes: Note[]
  activities: Activity[]
  freeDraft: FreeDraft | null
  strava: StravaLink | null
}
