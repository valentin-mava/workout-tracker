import type { Activity, ActivityType, AppData, SportLog } from './types'

const WORKER = import.meta.env.VITE_STRAVA_WORKER as string | undefined

export const stravaAvailable = !!WORKER

const CARDIO: Record<string, ActivityType> = {
  Run: 'run',
  TrailRun: 'run',
  VirtualRun: 'run',
  Ride: 'ride',
  VirtualRide: 'ride',
  GravelRide: 'ride',
  MountainBikeRide: 'ride',
  EBikeRide: 'ride',
  EMountainBikeRide: 'ride',
  Swim: 'swim',
  Hike: 'hike',
  Walk: 'hike',
}

/** Krafttraining loggst du in der App selbst; diese Strava-Typen würden doppelt zählen */
const SKIP = new Set(['WeightTraining', 'Crossfit', 'Workout'])

const SPORT_LABEL: Record<string, string> = {
  Yoga: 'Yoga',
  Pilates: 'Pilates',
  Padel: 'Padel',
  Tennis: 'Tennis',
  Squash: 'Squash',
  Badminton: 'Badminton',
  Pickleball: 'Pickleball',
  TableTennis: 'Tischtennis',
  Soccer: 'Fußball',
  RockClimbing: 'Klettern',
  AlpineSki: 'Ski',
  BackcountrySki: 'Skitour',
  NordicSki: 'Langlauf',
  Snowboard: 'Snowboard',
  Rowing: 'Rudern',
  Elliptical: 'Crosstrainer',
  StairStepper: 'Stepper',
  Golf: 'Golf',
  Surfing: 'Surfen',
  StandUpPaddling: 'SUP',
}

interface StravaActivity {
  id: string
  sportType: string
  name: string
  date: string
  distanceM: number
  movingSec: number
  avgHr: number | null
  elevM: number | null
}

export function newKey() {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export const connectUrl = (key: string) => `${WORKER}/connect?key=${encodeURIComponent(key)}`

export type SyncResult = 'ok' | 'not_connected' | 'error'

let running: Promise<SyncResult> | null = null

/** Holt neue Strava-Aktivitäten: Cardio landet in `activities`, anderer Sport in `sportLogs` */
export function syncStrava(data: AppData, update: (fn: (d: AppData) => AppData) => void): Promise<SyncResult> {
  running ??= doSync(data, update).finally(() => (running = null))
  return running
}

async function doSync(data: AppData, update: (fn: (d: AppData) => AppData) => void): Promise<SyncResult> {
  const link = data.strava
  if (!WORKER || !link) return 'not_connected'

  // Ab der neuesten bekannten Aktivität (mit Puffer für nachträglich hochgeladene)
  const dates = [...data.activities.map((a) => a.date), ...data.sportLogs.filter((s) => s.source === 'strava').map((s) => s.date)]
  const latest = dates.reduce((a, b) => (b > a ? b : a), '')
  const after = latest ? Math.floor(Date.parse(latest) / 1000) - 3 * 86_400 : 0

  const all: StravaActivity[] = []
  let athlete: string | undefined
  try {
    for (let page = 1; page <= 30; page++) {
      const res = await fetch(`${WORKER}/activities?page=${page}&after=${after}`, { headers: { Authorization: `Bearer ${link.key}` } })
      if (res.status === 401) {
        update((d) => (d.strava ? { ...d, strava: { ...d.strava, connected: false } } : d))
        return 'not_connected'
      }
      if (!res.ok) return 'error'
      const body = (await res.json()) as { athlete?: string; activities: StravaActivity[] }
      athlete = body.athlete || athlete
      all.push(...body.activities)
      if (body.activities.length < 100) break
    }
  } catch {
    return 'error'
  }

  update((d) => {
    const acts = new Map(d.activities.map((a) => [a.id, a]))
    const sportIds = new Set(d.sportLogs.map((s) => s.id))
    const newSports: SportLog[] = []
    for (const a of all) {
      if (SKIP.has(a.sportType)) continue
      const type = CARDIO[a.sportType]
      if (type) {
        const act: Activity = { id: a.id, type, name: a.name, date: a.date, distanceM: a.distanceM, movingSec: a.movingSec }
        if (a.avgHr) act.avgHr = a.avgHr
        if (a.elevM) act.elevM = a.elevM
        acts.set(a.id, act)
      } else if (!sportIds.has(`strava-${a.id}`)) {
        // Einmal übernehmen; danach gehören Intensität und Notiz dir
        newSports.push({
          id: `strava-${a.id}`,
          sport: SPORT_LABEL[a.sportType] ?? a.name,
          date: a.date,
          durationMinutes: Math.max(1, Math.round(a.movingSec / 60)),
          intensity: 0,
          source: 'strava',
        })
      }
    }
    return {
      ...d,
      activities: [...acts.values()],
      sportLogs: [...d.sportLogs, ...newSports],
      strava: d.strava ? { ...d.strava, connected: true, athlete: athlete ?? d.strava.athlete, lastSync: new Date().toISOString() } : d.strava,
    }
  })
  return 'ok'
}

export async function disconnectStrava(key: string) {
  if (!WORKER) return
  await fetch(`${WORKER}/disconnect`, { method: 'POST', headers: { Authorization: `Bearer ${key}` } }).catch(() => undefined)
}
