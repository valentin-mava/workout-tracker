import { entryBefore, formatKm, progress, relativeDay, weekStart } from '../format'
import { useStore } from '../store'
import { go, Header, Icon } from '../ui'
import { WeekBlock } from '../WeekBlock'

export function Overview() {
  const { data } = useStore()
  const latest = <T extends { date: string }>(xs: T[]) => xs.reduce<T | null>((a, x) => (!a || x.date > a.date ? x : a), null)

  const lastLog = latest(data.logs)
  const lastAct = latest(data.activities)
  const lastSport = latest(data.sportLogs)

  // Größte Steigerung der letzten 4 Wochen für die Tracker-Kachel
  let best: { name: string; text: string } | null = null
  for (const w of data.workouts) {
    for (const ex of w.exercises) {
      const p = progress(ex, entryBefore(data, ex.id, 28))
      if (p?.up && !best) best = { name: ex.name, text: p.text }
    }
  }

  const today = new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'short' })

  return (
    <main className="screen">
      <Header
        kicker={today}
        title="Overview"
        right={
          <button className="icon-btn" onClick={() => go('backup')} aria-label="Backup">
            <Icon name="backup" />
          </button>
        }
      />

      <WeekBlock start={weekStart(new Date())} />

      <nav className="tiles" aria-label="Bereiche">
        <button className="tile big strong" onClick={() => go('workouts')}>
          <Icon name="dumbbell" size={28} />
          <span className="tile-text">
            <span className="display tile-title">Workouts</span>
            <span className="tile-sub">{lastLog ? `${lastLog.workoutName} · ${relativeDay(lastLog.date)}` : `${data.workouts.length} Workouts`}</span>
          </span>
        </button>
        <button className="tile big accent" onClick={() => go('cardio')}>
          <Icon name="pulse" size={28} />
          <span className="tile-text">
            <span className="display tile-title">Cardio</span>
            <span className="tile-sub">{lastAct ? `${formatKm(lastAct.distanceM)} km · ${relativeDay(lastAct.date)}` : 'Strava verbinden'}</span>
          </span>
        </button>
        <button className="tile" onClick={() => go('sports')}>
          <Icon name="ball" size={26} />
          <span className="tile-text">
            <span className="display tile-title">Other Sports</span>
            <span className="tile-sub">{lastSport ? `${lastSport.sport} · ${relativeDay(lastSport.date)}` : 'Mobility, Padel …'}</span>
          </span>
        </button>
        <button className="tile" onClick={() => go('notes')}>
          <Icon name="note" size={26} />
          <span className="tile-text">
            <span className="display tile-title">Notes</span>
            <span className="tile-sub">{data.notes.length === 1 ? '1 Notiz' : `${data.notes.length} Notizen`}</span>
          </span>
        </button>
        <button className="tile wide" onClick={() => go('tracker')}>
          <span className="tile-text">
            <span className="display tile-title">Tracker</span>
            <span className="tile-sub">{best ? `${best.name} in 4 Wochen` : 'Wochen und aktuelle Werte'}</span>
          </span>
          {best ? <span className="badge">{best.text}</span> : <Icon name="chart" size={26} />}
        </button>
        <div className="tile soon">
          <span className="display tile-title" style={{ fontSize: 20 }}>
            Nutrition
          </span>
          <span className="small" style={{ fontWeight: 600 }}>
            kommt später
          </span>
        </div>
      </nav>
    </main>
  )
}
