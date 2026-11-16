import { useState } from 'react'
import { DoneSheet } from '../DoneSheet'
import { ExerciseRow } from '../ExerciseRow'
import { formatMinutes, typicalMinutes } from '../format'
import { useStore } from '../store'
import { go, Header, Redirect } from '../ui'

/** Zurück dorthin, woher man kam (Workout oder Tracker) */
const back = () => (history.length > 1 ? history.back() : go('tracker'))

/** Ein erledigtes Workout mit den Werten von damals */
export function LogDetail({ id }: { id: string }) {
  const { data, update } = useStore()
  const [editing, setEditing] = useState(false)
  const log = data.logs.find((l) => l.id === id)
  if (!log) return <Redirect to="tracker" />

  const date = new Date(log.date).toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  const remove = () => {
    if (!confirm(`„${log.workoutName}“ vom ${date} löschen? Deine Übungen und Gewichte bleiben unverändert.`)) return
    update((d) => ({ ...d, logs: d.logs.filter((l) => l.id !== id) }))
    back()
  }

  const save = (newDate: string, durationMinutes: number | undefined) => {
    update((d) => ({ ...d, logs: d.logs.map((l) => (l.id === id ? { ...l, date: newDate, durationMinutes } : l)) }))
    setEditing(false)
  }

  return (
    <main className="screen">
      <Header
        back={{ label: 'Zurück', onClick: back }}
        kicker={date}
        title={log.workoutName}
        right={
          <button className="pill-btn" onClick={() => setEditing(true)}>
            Bearbeiten
          </button>
        }
      />
      <p className="muted" style={{ marginTop: -10 }}>
        {log.durationMinutes ? formatMinutes(log.durationMinutes) : `Dauer nicht eingetragen · gezählt als ~${formatMinutes(typicalMinutes(data))}`}
      </p>
      <ol className="list tight">
        {log.entries.map((e, i) => (
          <ExerciseRow key={e.exerciseId} ex={{ ...e, id: e.exerciseId }} index={i} />
        ))}
      </ol>
      <button className="btn danger" onClick={remove}>
        Eintrag löschen
      </button>

      <DoneSheet open={editing} title="Eintrag bearbeiten" initial={log} onClose={() => setEditing(false)} onSave={save} />
    </main>
  )
}
