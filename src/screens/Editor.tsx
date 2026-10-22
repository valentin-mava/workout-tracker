import { useState } from 'react'
import { DEFAULTS, METRIC_LABEL, summary } from '../format'
import { MetricSteppers } from '../MetricSteppers'
import { uid, useStore } from '../store'
import { METRICS, type Exercise, type Workout } from '../types'
import { go, Header, Icon, Sheet } from '../ui'

export function Editor({ id }: { id: string }) {
  const { data, update } = useStore()
  const workout = data.workouts.find((w) => w.id === id)
  const [editing, setEditing] = useState<Exercise | null>(null)

  if (!workout) {
    go('')
    return null
  }

  const save = (w: Workout) => update((d) => ({ ...d, workouts: d.workouts.map((x) => (x.id === w.id ? w : x)) }))
  const setExercises = (exercises: Exercise[]) => save({ ...workout, exercises })

  const move = (i: number, dir: -1 | 1) => {
    const list = [...workout.exercises]
    ;[list[i], list[i + dir]] = [list[i + dir], list[i]]
    setExercises(list)
  }

  const back = () => {
    // Leeres, nie benanntes Workout nicht liegen lassen
    if (!workout.name.trim() && !workout.exercises.length) {
      update((d) => ({ ...d, workouts: d.workouts.filter((w) => w.id !== id) }))
    }
    go('')
  }

  const remove = () => {
    if (!confirm(`„${workout.name || 'Workout'}“ löschen? Bisherige Trainings bleiben im Verlauf.`)) return
    update((d) => ({ ...d, workouts: d.workouts.filter((w) => w.id !== id) }))
    go('')
  }

  const saveExercise = (ex: Exercise) => {
    const exists = workout.exercises.some((e) => e.id === ex.id)
    setExercises(exists ? workout.exercises.map((e) => (e.id === ex.id ? ex : e)) : [...workout.exercises, ex])
    setEditing(null)
  }

  return (
    <main className="screen">
      <Header title="Workout bearbeiten" back={back} />

      <input
        className="title-input"
        value={workout.name}
        placeholder="Name, z. B. Upper Body"
        autoFocus={!workout.name}
        onChange={(e) => save({ ...workout, name: e.target.value })}
      />

      <ul className="cards">
        {workout.exercises.map((ex, i) => (
          <li key={ex.id} className="card exercise-row">
            <button className="card-main" onClick={() => setEditing(ex)}>
              <span className="card-title">{ex.name || 'Ohne Namen'}</span>
              <span className="card-meta">{summary(ex, ex.track) || 'ohne Werte'}</span>
              {ex.note ? <span className="card-note">{ex.note}</span> : null}
            </button>
            <div className="reorder">
              <button className="icon-btn" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Nach oben">
                <Icon name="up" size={20} />
              </button>
              <button className="icon-btn" disabled={i === workout.exercises.length - 1} onClick={() => move(i, 1)} aria-label="Nach unten">
                <Icon name="down" size={20} />
              </button>
            </div>
          </li>
        ))}
      </ul>

      <button
        className="btn secondary wide"
        onClick={() => setEditing({ id: uid(), name: '', track: ['sets', 'reps', 'weight'], sets: DEFAULTS.sets, reps: DEFAULTS.reps, weight: DEFAULTS.weight })}
      >
        <Icon name="plus" size={20} /> Übung hinzufügen
      </button>

      <button className="btn danger-link" onClick={remove}>
        Workout löschen
      </button>

      <Sheet open={!!editing} onClose={() => setEditing(null)}>
        {editing ? (
          <ExerciseForm
            key={editing.id}
            initial={editing}
            isNew={!workout.exercises.some((e) => e.id === editing.id)}
            onSave={saveExercise}
            onDelete={() => {
              setExercises(workout.exercises.filter((e) => e.id !== editing.id))
              setEditing(null)
            }}
          />
        ) : null}
      </Sheet>
    </main>
  )
}

function ExerciseForm({ initial, isNew, onSave, onDelete }: { initial: Exercise; isNew: boolean; onSave: (e: Exercise) => void; onDelete: () => void }) {
  const [ex, setEx] = useState(initial)

  const toggle = (m: (typeof METRICS)[number]) => {
    const track = ex.track.includes(m) ? ex.track.filter((t) => t !== m) : [...ex.track, m]
    setEx({ ...ex, track, [m]: ex[m] ?? DEFAULTS[m] })
  }

  return (
    <div className="form">
      <input className="field" value={ex.name} placeholder="Übung, z. B. Bankdrücken" autoFocus={isNew} onChange={(e) => setEx({ ...ex, name: e.target.value })} />

      <div>
        <span className="field-label">Was trackst du?</span>
        <div className="chips">
          {METRICS.map((m) => (
            <button key={m} className={`chip${ex.track.includes(m) ? ' on' : ''}`} onClick={() => toggle(m)} aria-pressed={ex.track.includes(m)}>
              {METRIC_LABEL[m]}
            </button>
          ))}
        </div>
      </div>

      {ex.track.length ? (
        <div>
          <span className="field-label">Startwerte</span>
          <MetricSteppers values={ex} track={ex.track} onChange={(v) => setEx({ ...ex, ...v })} />
          <p className="hint">Danach schlägt die App immer die Werte von deinem letzten Training vor.</p>
        </div>
      ) : null}

      <textarea className="field" rows={2} value={ex.note ?? ''} placeholder="Notiz, z. B. Griff eng, 90 s Pause" onChange={(e) => setEx({ ...ex, note: e.target.value || undefined })} />

      <div className="form-actions">
        {!isNew ? (
          <button className="btn danger-link" onClick={() => confirm('Übung löschen?') && onDelete()}>
            Löschen
          </button>
        ) : (
          <span />
        )}
        <button className="btn primary" onClick={() => onSave({ ...ex, name: ex.name.trim() })} disabled={!ex.name.trim()}>
          {isNew ? 'Hinzufügen' : 'Fertig'}
        </button>
      </div>
    </div>
  )
}
