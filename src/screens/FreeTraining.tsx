import { useRef, useState } from 'react'
import { DoneSheet } from '../DoneSheet'
import { ExerciseRow } from '../ExerciseRow'
import { ExerciseSheet, newExercise } from '../ExerciseSheet'
import { uid, useStore } from '../store'
import type { Exercise, FreeDraft, WorkoutLog } from '../types'
import { go, Header, Icon, Redirect } from '../ui'

/** Unterwegs einfach eintragen, was man gemacht hat; optional danach als Workout speichern */
export function FreeTraining() {
  const { data, update } = useStore()
  const draft = data.freeDraft
  const [editing, setEditing] = useState<Exercise | null>(null)
  const [done, setDone] = useState(false)
  const [keep, setKeep] = useState(false)
  // Nach dem Speichern selbst navigieren, statt auf die Workout-Liste umzuleiten
  const leaving = useRef(false)
  if (!draft) return leaving.current ? null : <Redirect to="workouts" />

  const setDraft = (patch: Partial<FreeDraft>) => update((d) => (d.freeDraft ? { ...d, freeDraft: { ...d.freeDraft, ...patch } } : d))
  const isNew = !!editing && !draft.exercises.some((e) => e.id === editing.id)
  const name = draft.name.trim() || 'Freies Training'

  const saveExercise = (ex: Exercise, another: boolean) => {
    const exists = draft.exercises.some((e) => e.id === ex.id)
    setDraft({ exercises: exists ? draft.exercises.map((e) => (e.id === ex.id ? ex : e)) : [...draft.exercises, ex] })
    setEditing(another ? { ...newExercise(), tool: ex.tool, sets: ex.sets, reps: ex.reps, unit: ex.unit, weight: ex.weight } : null)
  }

  const discard = () => {
    if (draft.exercises.length && !confirm('Freies Training verwerfen?')) return
    update((d) => ({ ...d, freeDraft: null }))
    go('workouts')
  }

  const save = (date: string, durationMinutes: number | undefined) => {
    leaving.current = true
    const workoutId = keep ? uid() : null
    const log: WorkoutLog = {
      id: uid(),
      workoutId,
      workoutName: name,
      date,
      durationMinutes,
      entries: draft.exercises.map(({ id: exerciseId, note: _note, ...rest }) => ({ exerciseId, ...rest })),
    }
    update((d) => ({
      ...d,
      freeDraft: null,
      logs: [...d.logs, log],
      workouts: workoutId ? [...d.workouts, { id: workoutId, name, exercises: draft.exercises }] : d.workouts,
    }))
    go(workoutId ? `workout/${workoutId}` : 'workouts')
  }

  return (
    <main className="screen with-footer">
      <Header
        back={{ label: 'Workouts', to: 'workouts' }}
        right={
          <button className="btn danger" onClick={discard}>
            Verwerfen
          </button>
        }
        title="Freies Training"
      />

      <input className="field" value={draft.name} placeholder="Name (optional), z. B. Hotel Kettlebell" onChange={(e) => setDraft({ name: e.target.value })} />

      {draft.exercises.length ? (
        <ol className="list tight">
          {draft.exercises.map((ex, i) => (
            <ExerciseRow key={ex.id} ex={ex} index={i} onClick={() => setEditing(ex)} />
          ))}
        </ol>
      ) : (
        <p className="muted">Trag nacheinander ein, was du machst. Tool und Werte der letzten Übung werden übernommen.</p>
      )}

      <button className="btn outline wide" onClick={() => setEditing(newExercise())}>
        <Icon name="plus" size={18} stroke={2.4} /> Übung hinzufügen
      </button>

      <footer className="footer">
        <button className="btn dark wide btn-big" disabled={!draft.exercises.length} onClick={() => setDone(true)}>
          <Icon name="check" size={24} stroke={3} />
          Erledigt
        </button>
      </footer>

      <ExerciseSheet
        exercise={editing}
        isNew={isNew}
        onClose={() => setEditing(null)}
        onSave={saveExercise}
        onDelete={() => {
          setDraft({ exercises: draft.exercises.filter((e) => e.id !== editing?.id) })
          setEditing(null)
        }}
      />

      <DoneSheet open={done} title={`${name} erledigt`} onClose={() => setDone(false)} onSave={save}>
        <label className="check-row">
          <input type="checkbox" checked={keep} onChange={(e) => setKeep(e.target.checked)} />
          Als Workout speichern
        </label>
      </DoneSheet>
    </main>
  )
}
