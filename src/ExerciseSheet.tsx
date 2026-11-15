import { useState } from 'react'
import { TOOL_LABEL } from './format'
import { uid } from './store'
import { TOOLS, type Exercise } from './types'
import { Chips, Sheet, Stepper } from './ui'

export const newExercise = (): Exercise => ({ id: uid(), name: '', sets: 3, reps: 10, unit: 'reps', weight: 20 })

interface Props {
  exercise: Exercise | null
  isNew: boolean
  onSave: (e: Exercise, addAnother: boolean) => void
  onDelete: () => void
  onClose: () => void
}

/** Übung anlegen/bearbeiten. "Speichern & nächste" macht das Anlegen ganzer Workouts schnell. */
export function ExerciseSheet({ exercise, isNew, onSave, onDelete, onClose }: Props) {
  return (
    <Sheet open={!!exercise} onClose={onClose} title={isNew ? 'Neue Übung' : 'Übung bearbeiten'}>
      {exercise ? <ExerciseForm key={exercise.id} initial={exercise} isNew={isNew} onSave={onSave} onDelete={onDelete} /> : null}
    </Sheet>
  )
}

function ExerciseForm({ initial, isNew, onSave, onDelete }: { initial: Exercise; isNew: boolean; onSave: Props['onSave']; onDelete: () => void }) {
  const [ex, setEx] = useState(initial)
  const set = (patch: Partial<Exercise>) => setEx({ ...ex, ...patch })
  const valid = !!ex.name.trim()
  const save = (another: boolean) => onSave({ ...ex, name: ex.name.trim(), note: ex.note?.trim() || undefined }, another)

  return (
    <div className="form">
      <input className="field" value={ex.name} placeholder="Name, z. B. Pull Ups" autoFocus={isNew} onChange={(e) => set({ name: e.target.value })} />

      <div className="field-wrap">
        <span className="label">Tool</span>
        <Chips label="Tool" options={TOOLS.map((t) => ({ value: t, label: TOOL_LABEL[t] }))} value={ex.tool} onChange={(tool) => set({ tool, weight: ex.weight ?? 20 })} />
      </div>

      <div className="steppers">
        <Stepper label="Sätze" value={ex.sets} step={1} min={1} onChange={(sets) => set({ sets })} />
        <Stepper label={ex.unit === 'sec' ? 'Sekunden' : 'Wdh.'} value={ex.reps} step={ex.unit === 'sec' ? 5 : 1} onChange={(reps) => set({ reps })} />
      </div>
      <Chips
        label="Einheit"
        options={[
          { value: 'reps', label: 'Wiederholungen' },
          { value: 'sec', label: 'Sekunden' },
        ]}
        value={ex.unit}
        onChange={(unit) => set({ unit, reps: unit === ex.unit ? ex.reps : unit === 'sec' ? 30 : 10 })}
      />

      {ex.tool !== 'bodyweight' ? <Stepper label="Gewicht" unit="kg" value={ex.weight ?? 0} step={2.5} onChange={(weight) => set({ weight })} /> : null}

      <textarea className="field" rows={2} value={ex.note ?? ''} placeholder="Notiz, z. B. Griff eng, Pause 90 s" onChange={(e) => set({ note: e.target.value })} />

      {isNew ? (
        <div className="btn-row">
          <button className="btn outline" disabled={!valid} onClick={() => save(true)}>
            + Nächste
          </button>
          <button className="btn dark" disabled={!valid} onClick={() => save(false)}>
            Fertig
          </button>
        </div>
      ) : (
        <div className="form-actions">
          <button className="btn danger" onClick={() => confirm('Übung löschen?') && onDelete()}>
            Löschen
          </button>
          <button className="btn dark" disabled={!valid} onClick={() => save(false)}>
            Fertig
          </button>
        </div>
      )}
    </div>
  )
}
