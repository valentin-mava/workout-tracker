import { useState } from 'react'
import { entryBefore, formatKg, hasWeight, progress, setsReps, sortedWorkouts, weekItems, weekStart } from '../format'
import { useStore } from '../store'
import { go, Header } from '../ui'
import { WeekBlock } from '../WeekBlock'

const DAYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']

export function Tracker() {
  const { data } = useStore()
  const [offset, setOffset] = useState(0)
  const start = weekStart(new Date())
  start.setDate(start.getDate() + offset * 7)
  const items = weekItems(data, start)
  const groups = sortedWorkouts(data).filter(({ w }) => w.exercises.length)

  return (
    <main className="screen">
      <Header back={{ label: 'Overview', to: '' }} title="Tracker" />

      <WeekBlock start={start} onNav={(d) => setOffset((o) => Math.min(0, o + d))} />

      <section className="section" aria-label="Aktivitäten der Woche">
        <h2 className="section-title">{offset === 0 ? 'Diese Woche' : 'In dieser Woche'}</h2>
        {items.length ? (
          <ul className="table">
            {items.map((it) => (
              <li key={it.id}>
                <button className="table-row" onClick={() => go(it.open)}>
                  <span className="day">{DAYS[new Date(it.date).getDay()]}</span>
                  <span className={`mini-dot ${it.kind}`} />
                  <span className="name">{it.name}</span>
                  <span className="val">{it.value}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">Noch nichts eingetragen.</p>
        )}
      </section>

      {groups.map(({ w }) => (
        <section key={w.id} className="section" aria-label={`Aktuelle Werte ${w.name}`}>
          <div className="section-head">
            <h2 className="section-title">{w.name || 'Ohne Namen'}</h2>
            <span className="small muted">vs. vor 4 Wochen</span>
          </div>
          <ul className="lift-grid">
            {w.exercises.map((ex) => {
              const p = progress(ex, entryBefore(data, ex.id, 28))
              return (
                <li key={ex.id} className="lift">
                  <span className="lift-name">{ex.name}</span>
                  <span className="display lift-value">{hasWeight(ex) ? formatKg(ex.weight!) : setsReps(ex)}</span>
                  {p ? <span className={`delta${p.up ? ' up' : ''}`}>{p.text}</span> : <span className="delta">{hasWeight(ex) ? setsReps(ex) : ''}</span>}
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </main>
  )
}
