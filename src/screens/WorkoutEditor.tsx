import { useState } from 'react'
import { ExerciseRow } from '../ExerciseRow'
import { ExerciseSheet, newExercise } from '../ExerciseSheet'
import { useStore } from '../store'
import type { Exercise, Workout } from '../types'
import { go, Header, Icon, Redirect } from '../ui'

export function WorkoutEditor({ id }: { id: string }) {
  const { data, update } = useStore()
  const workout = data.workouts.find((w) => w.id === id)
  const [editing, setEditing] = useState<Exercise | null>(null)
  if (!workout) return <Redirect to="workouts" />

  const save = (w: Workout) => update((d) => ({ ...d, workouts: d.workouts.map((x) => (x.id === w.id ? w : x)) }))
  const setExercises = (exercises: Exercise[]) => save({ ...workout, exercises })
  const isNew = !!editing && !workout.exercises.some((e) => e.id === editing.id)

  const move = (i: number, dir: -1 | 1) => {
    const list = [...workout.exercises]
    ;[list[i], list[i + dir]] = [list[i + dir], list[i]]
    setExercises(list)
  }

  const close = () => {
    // Leeres, nie benanntes Workout nicht liegen lassen
    if (!workout.name.trim() && !workout.exercises.length) {
      update((d) => ({ ...d, workouts: d.workouts.filter((w) => w.id !== id) }))
      return go('workouts')
    }
    go(`workout/${id}`)
  }

  const remove = () => {
    if (!confirm(`„${workout.name || 'Workout'}“ löschen? Erledigte Trainings bleiben im Tracker.`)) return
    update((d) => ({ ...d, workouts: d.workouts.filter((w) => w.id !== id) }))
    go('workouts')
  }

  const saveExercise = (ex: Exercise, another: boolean) => {
    const exists = workout.exercises.some((e) => e.id === ex.id)
    setExercises(exists ? workout.exercises.map((e) => (e.id === ex.id ? ex : e)) : [...workout.exercises, ex])
    // Beim schnellen Anlegen Tool und Werte der letzten Übung übernehmen
    setEditing(another ? { ...newExercise(), tool: ex.tool, sets: ex.sets, reps: ex.reps, unit: ex.unit, weight: ex.weight } : null)
  }

  return (
    <main className="screen with-footer">
      <Header back={{ label: 'Fertig', onClick: close }} title="Bearbeiten" />

      <input className="title-input" value={workout.name} placeholder="Name" aria-label="Name des Workouts" autoFocus={!workout.name} onChange={(e) => save({ ...workout, name: e.target.value })} />

      <ol className="list tight">
        {workout.exercises.map((ex, i) => (
          <ExerciseRow
            key={ex.id}
            ex={ex}
            index={i}
            onClick={() => setEditing(ex)}
            aside={
              <span className="reorder">
                <button className="icon-btn" disabled={i === 0} onClick={() => move(i, -1)} aria-label={`${ex.name} nach oben`}>
                  <Icon name="up" size={20} />
                </button>
                <button className="icon-btn" disabled={i === workout.exercises.length - 1} onClick={() => move(i, 1)} aria-label={`${ex.name} nach unten`}>
                  <Icon name="down" size={20} />
                </button>
              </span>
            }
          />
        ))}
      </ol>

      <button className="btn outline wide" onClick={() => setEditing(newExercise())}>
        <Icon name="plus" size={18} stroke={2.4} /> Übung hinzufügen
      </button>

      <button className="btn danger" onClick={remove}>
        Workout löschen
      </button>

      <footer className="footer">
        <button className="btn dark wide" onClick={close}>
          Fertig
        </button>
      </footer>

      <ExerciseSheet
        exercise={editing}
        isNew={isNew}
        onClose={() => setEditing(null)}
        onSave={saveExercise}
        onDelete={() => {
          setExercises(workout.exercises.filter((e) => e.id !== editing?.id))
          setEditing(null)
        }}
      />
    </main>
  )
}
