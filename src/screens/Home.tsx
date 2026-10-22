import { DEFAULTS, lastValues, relativeDay, workoutStats } from '../format'
import { uid, useStore } from '../store'
import type { Draft, Workout } from '../types'
import { go, Header, Icon } from '../ui'

export function Home() {
  const { data, update } = useStore()
  const { draft } = data

  const start = (w: Workout) => {
    if (draft && draft.workoutId === w.id) return go('session')
    if (draft && !confirm(`Laufendes Training „${draft.workoutName}“ verwerfen?`)) return
    const next: Draft = {
      id: uid(),
      workoutId: w.id,
      workoutName: w.name,
      date: new Date().toISOString(),
      entries: w.exercises.map((ex) => {
        const last = lastValues(data, ex)
        const pick = <K extends keyof typeof DEFAULTS>(k: K) => last?.[k] ?? ex[k] ?? DEFAULTS[k]
        return {
          exerciseId: ex.id,
          exerciseName: ex.name,
          track: ex.track,
          sets: pick('sets'),
          reps: pick('reps'),
          weight: pick('weight'),
          time: pick('time'),
          done: false,
        }
      }),
    }
    update((d) => ({ ...d, draft: next }))
    go('session')
  }

  const create = () => {
    const w: Workout = { id: uid(), name: '', exercises: [] }
    update((d) => ({ ...d, workouts: [...d.workouts, w] }))
    go(`edit/${w.id}`)
  }

  return (
    <main className="screen">
      <Header
        title="Workouts"
        right={
          <button className="icon-btn" onClick={() => go('backup')} aria-label="Backup">
            <Icon name="backup" />
          </button>
        }
      />

      {draft ? (
        <button className="draft-banner" onClick={() => go('session')}>
          <span>
            <strong>{draft.workoutName || 'Training'}</strong> läuft
            <small>{draft.entries.filter((e) => e.done).length} von {draft.entries.length} erledigt</small>
          </span>
          <span className="pill">Weiter</span>
        </button>
      ) : null}

      {data.workouts.length === 0 ? (
        <div className="empty">
          <p>Noch keine Workouts.</p>
          <p className="muted">Lege einmal deine Workouts an, danach trägst du im Training nur noch ein, was du geschafft hast.</p>
        </div>
      ) : (
        <ul className="cards">
          {data.workouts.map((w) => {
            const s = workoutStats(data, w)
            const meta = [
              `${w.exercises.length} ${w.exercises.length === 1 ? 'Übung' : 'Übungen'}`,
              s.last ? relativeDay(s.last) : 'noch nie',
              s.avg != null ? `Ø ${s.avg} min` : null,
            ].filter(Boolean)
            return (
              <li key={w.id} className={`card workout-card${draft?.workoutId === w.id ? ' active' : ''}`}>
                <button className="card-main" onClick={() => start(w)} disabled={!w.exercises.length}>
                  <span className="card-title">{w.name || 'Ohne Namen'}</span>
                  <span className="card-meta">{meta.join(' · ')}</span>
                </button>
                <button className="icon-btn" onClick={() => go(`edit/${w.id}`)} aria-label={`${w.name} bearbeiten`}>
                  <Icon name="edit" size={20} />
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <button className="btn secondary wide" onClick={create}>
        <Icon name="plus" size={20} /> Neues Workout
      </button>
    </main>
  )
}
