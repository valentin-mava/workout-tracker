import { ExerciseRow } from '../ExerciseRow'
import { formatMinutes } from '../format'
import { useStore } from '../store'
import { go, Header, Redirect } from '../ui'

/** Ein erledigtes Workout mit den Werten von damals */
export function LogDetail({ id }: { id: string }) {
  const { data, update } = useStore()
  const log = data.logs.find((l) => l.id === id)
  if (!log) return <Redirect to="tracker" />

  const date = new Date(log.date).toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })

  const remove = () => {
    if (!confirm('Diesen Eintrag löschen?')) return
    update((d) => ({ ...d, logs: d.logs.filter((l) => l.id !== id) }))
    go('tracker')
  }

  return (
    <main className="screen">
      <Header back={{ label: 'Tracker', to: 'tracker' }} kicker={date} title={log.workoutName} />
      <p className="muted" style={{ marginTop: -10 }}>
        {log.durationMinutes ? formatMinutes(log.durationMinutes) : 'Dauer nicht eingetragen'}
      </p>
      <ol className="list tight">
        {log.entries.map((e, i) => (
          <ExerciseRow key={e.exerciseId} ex={{ ...e, id: e.exerciseId }} index={i} />
        ))}
      </ol>
      <button className="btn danger" onClick={remove}>
        Eintrag löschen
      </button>
    </main>
  )
}
