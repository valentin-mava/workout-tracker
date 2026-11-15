import { useState } from 'react'
import { DoneSheet } from '../DoneSheet'
import { ExerciseRow } from '../ExerciseRow'
import { formatMinutes, relativeDay, workoutStats } from '../format'
import { uid, useStore } from '../store'
import type { WorkoutLog } from '../types'
import { go, Header, Icon, Redirect } from '../ui'

export function WorkoutDetail({ id }: { id: string }) {
  const { data, update } = useStore()
  const [done, setDone] = useState(false)
  const workout = data.workouts.find((w) => w.id === id)
  if (!workout) return <Redirect to="workouts" />

  const s = workoutStats(data, workout)
  const meta = [
    `${workout.exercises.length} ${workout.exercises.length === 1 ? 'Übung' : 'Übungen'}`,
    s.avg != null ? `Ø ${formatMinutes(s.avg)}` : null,
    s.last ? `zuletzt ${relativeDay(s.last)}` : 'noch nie gemacht',
  ].filter(Boolean)

  const save = (date: string, durationMinutes: number | undefined) => {
    const log: WorkoutLog = {
      id: uid(),
      workoutId: workout.id,
      workoutName: workout.name,
      date,
      durationMinutes,
      entries: workout.exercises.map(({ id: exerciseId, note: _note, ...rest }) => ({ exerciseId, ...rest })),
    }
    update((d) => ({ ...d, logs: [...d.logs, log] }))
    setDone(false)
    go('workouts')
  }

  return (
    <main className="screen with-footer">
      <Header
        back={{ label: 'Workouts', to: 'workouts' }}
        right={
          <button className="pill-btn" onClick={() => go(`edit/${workout.id}`)}>
            Bearbeiten
          </button>
        }
        title={workout.name || 'Ohne Namen'}
      />
      <p className="muted" style={{ marginTop: -10 }}>
        {meta.join(' · ')}
      </p>

      {workout.exercises.length ? (
        <ol className="list tight">
          {workout.exercises.map((ex, i) => (
            <ExerciseRow key={ex.id} ex={ex} index={i} />
          ))}
        </ol>
      ) : (
        <p className="muted">Noch keine Übungen. Tippe auf „Bearbeiten“, um welche hinzuzufügen.</p>
      )}

      <footer className="footer">
        <button className="btn dark wide btn-big" disabled={!workout.exercises.length} onClick={() => setDone(true)}>
          <Icon name="check" size={24} stroke={3} />
          Erledigt
        </button>
      </footer>

      <DoneSheet open={done} title={`${workout.name} erledigt`} onClose={() => setDone(false)} onSave={save} />
    </main>
  )
}
