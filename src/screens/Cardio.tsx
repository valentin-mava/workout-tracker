import { useState } from 'react'
import { ACTIVITY_LABEL, formatKm, formatSec, shortDate, shortTime, speed } from '../format'
import { useStore } from '../store'
import type { ActivityType } from '../types'
import { Chips, Header } from '../ui'

const FILTERS: (ActivityType | 'all')[] = ['all', 'run', 'ride', 'swim', 'hike']

export function Cardio() {
  const { data } = useStore()
  const [filter, setFilter] = useState<ActivityType | 'all'>('all')
  const acts = data.activities.filter((a) => filter === 'all' || a.type === filter).sort((a, b) => b.date.localeCompare(a.date))

  return (
    <main className="screen">
      <Header back={{ label: 'Overview', to: '' }} title="Cardio" />

      {data.activities.length === 0 ? (
        <div className="callout">
          <span className="display">Strava verbinden</span>
          <p className="muted">Hier erscheinen deine Läufe, Radfahrten, Schwimm-Einheiten und Wanderungen aus Strava, mit Datum, Distanz, Dauer, Pace und Ø-Puls.</p>
          <button className="btn dark" disabled>
            Kommt im nächsten Schritt
          </button>
        </div>
      ) : (
        <>
          <Chips label="Sportart filtern" options={FILTERS.map((f) => ({ value: f, label: f === 'all' ? 'Alle' : ACTIVITY_LABEL[f] }))} value={filter} onChange={setFilter} />
          <ul className="list">
            {acts.map((a) => {
              const sp = speed(a)
              return (
                <li key={a.id} className="act">
                  <div className="act-head">
                    <span className="display">{a.name}</span>
                    <span>
                      {shortDate(a.date)} · {shortTime(a.date)}
                    </span>
                  </div>
                  <div className="stats">
                    <div className="stat">
                      <strong>{formatKm(a.distanceM)}</strong>
                      <span>km</span>
                    </div>
                    <div className="stat">
                      <strong>{formatSec(a.movingSec)}</strong>
                      <span>Dauer</span>
                    </div>
                    <div className="stat">
                      <strong>{sp.value}</strong>
                      <span>{sp.unit}</span>
                    </div>
                    <div className="stat">
                      <strong>{a.avgHr ? Math.round(a.avgHr) : '–'}</strong>
                      <span>Ø Puls</span>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </main>
  )
}
