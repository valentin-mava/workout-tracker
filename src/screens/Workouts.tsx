import { relativeDay, sortedWorkouts } from '../format'
import { uid, useStore } from '../store'
import { Empty, go, Header, Icon } from '../ui'

export function Workouts() {
  const { data, update } = useStore()
  const list = sortedWorkouts(data)

  const create = () => {
    const id = uid()
    update((d) => ({ ...d, workouts: [...d.workouts, { id, name: '', exercises: [] }] }))
    go(`edit/${id}`)
  }

  const free = () => {
    if (!data.freeDraft) update((d) => ({ ...d, freeDraft: { name: '', startedAt: new Date().toISOString(), exercises: [] } }))
    go('free')
  }

  return (
    <main className="screen">
      <Header back={{ label: 'Overview', to: '' }} title="Workouts" />

      <div className="btn-row">
        <button className="btn dark" onClick={free}>
          <Icon name="bolt" size={18} stroke={2.4} />
          {data.freeDraft ? 'Freies Training läuft' : 'Freies Training'}
        </button>
        <button className="btn outline" onClick={create}>
          <Icon name="plus" size={18} stroke={2.4} />
          Neues Workout
        </button>
      </div>

      {list.length ? (
        <section className="section">
          <span className="section-title">Nach Häufigkeit · letzte 3 Monate</span>
          <ul className="list">
            {list.map(({ w, s }, i) => (
              <li key={w.id}>
                <button className="row-card" onClick={() => go(`workout/${w.id}`)}>
                  <span className={`count${i < 2 && s.recent > 0 ? ' hot' : ''}`}>{s.recent}×</span>
                  <span className="row-text">
                    <span className="display row-title">{w.name || 'Ohne Namen'}</span>
                    <span className="row-sub">
                      {w.exercises.length} {w.exercises.length === 1 ? 'Übung' : 'Übungen'} · {s.last ? relativeDay(s.last) : 'noch nie'}
                    </span>
                  </span>
                  <span className="chev">
                    <Icon name="chevron" size={20} />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <Empty title="Noch keine Workouts">Lege ein Workout an oder starte ein freies Training und speichere es danach.</Empty>
      )}
    </main>
  )
}
