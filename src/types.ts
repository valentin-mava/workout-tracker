/** Welche Werte eine Übung erfasst. Mobility z. B. nur "time", Bodyweight ohne "weight". */
export type Metric = 'sets' | 'reps' | 'weight' | 'time'

export const METRICS: Metric[] = ['sets', 'reps', 'weight', 'time']

export interface Values {
  sets?: number
  reps?: number
  weight?: number
  /** Sekunden */
  time?: number
}

export interface Exercise extends Values {
  id: string
  name: string
  note?: string
  track: Metric[]
}

export interface Workout {
  id: string
  name: string
  exercises: Exercise[]
}

export interface SessionEntry extends Values {
  exerciseId: string
  exerciseName: string
  track: Metric[]
  done: boolean
}

export interface Session {
  id: string
  workoutId: string
  workoutName: string
  /** ISO-Zeitpunkt des Starts */
  date: string
  durationMinutes: number
  entries: SessionEntry[]
}

/** Laufendes Training, noch nicht gespeichert */
export type Draft = Omit<Session, 'durationMinutes'>

export interface AppData {
  version: 1
  workouts: Workout[]
  sessions: Session[]
  draft: Draft | null
}
