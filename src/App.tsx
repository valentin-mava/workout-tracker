import { Backup } from './screens/Backup'
import { Cardio } from './screens/Cardio'
import { FreeTraining } from './screens/FreeTraining'
import { LogDetail } from './screens/LogDetail'
import { NoteEditor, Notes } from './screens/Notes'
import { Overview } from './screens/Overview'
import { Sports } from './screens/Sports'
import { Tracker } from './screens/Tracker'
import { WorkoutDetail } from './screens/WorkoutDetail'
import { WorkoutEditor } from './screens/WorkoutEditor'
import { Workouts } from './screens/Workouts'
import { useEffect } from 'react'
import { StoreProvider, useStore } from './store'
import { syncStrava } from './strava'
import { useHash } from './ui'

function Routes() {
  const [screen, id] = useHash().split('/')
  switch (screen) {
    case 'workouts':
      return <Workouts />
    case 'workout':
      return <WorkoutDetail key={id} id={id} />
    case 'edit':
      return <WorkoutEditor key={id} id={id} />
    case 'free':
      return <FreeTraining />
    case 'log':
      return <LogDetail key={id} id={id} />
    case 'cardio':
      return <Cardio />
    case 'sports':
      return <Sports />
    case 'sport':
      return <Sports key={id} editId={id} />
    case 'notes':
      return <Notes />
    case 'note':
      return <NoteEditor key={id} id={id} />
    case 'tracker':
      return <Tracker />
    case 'backup':
      return <Backup />
    default:
      return <Overview />
  }
}

/** Synchronisiert Strava beim Öffnen und beim Zurückkehren in die App, höchstens alle 10 Minuten */
function StravaAutoSync() {
  const { get, update } = useStore()
  useEffect(() => {
    const run = () => {
      const d = get()
      if (document.visibilityState !== 'visible' || !d.strava) return
      const recent = d.strava.connected && d.strava.lastSync && Date.now() - Date.parse(d.strava.lastSync) < 10 * 60_000
      if (!recent) syncStrava(d, update)
    }
    run()
    document.addEventListener('visibilitychange', run)
    return () => document.removeEventListener('visibilitychange', run)
  }, [get, update])
  return null
}

export default function App() {
  return (
    <StoreProvider>
      <StravaAutoSync />
      <Routes />
    </StoreProvider>
  )
}
