import { useState } from 'react'
import { ACTIVITY_LABEL, formatKm, formatSec, relativeDay, shortDate, shortTime, speed } from '../format'
import { useStore } from '../store'
import { connectUrl, disconnectStrava, newKey, stravaAvailable, syncStrava, type SyncResult } from '../strava'
import type { ActivityType } from '../types'
import { Chips, Header } from '../ui'

const FILTERS: (ActivityType | 'all')[] = ['all', 'run', 'ride', 'swim', 'hike']

export function Cardio() {
  const { data, update } = useStore()
  const [filter, setFilter] = useState<ActivityType | 'all'>('all')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<SyncResult | null>(null)
  const link = data.strava
  const acts = data.activities.filter((a) => filter === 'all' || a.type === filter).sort((a, b) => b.date.localeCompare(a.date))

  const connect = () => {
    const key = link?.key ?? newKey()
    update((d) => ({ ...d, strava: { key, connected: false } }))
    location.href = connectUrl(key)
  }

  const refresh = async () => {
    setBusy(true)
    setResult(await syncStrava(data, update))
    setBusy(false)
  }

  const disconnect = async () => {
    if (!link || !confirm('Strava trennen? Bereits übernommene Aktivitäten bleiben in der App.')) return
    await disconnectStrava(link.key)
    update((d) => ({ ...d, strava: null }))
  }

  return (
    <main className="screen">
      <Header
        back={{ label: 'Overview', to: '' }}
        title="Cardio"
        right={
          link?.connected ? (
            <button className="pill-btn" onClick={refresh} disabled={busy}>
              {busy ? 'Lädt …' : 'Aktualisieren'}
            </button>
          ) : undefined
        }
      />

      {!link ? (
        <div className="callout">
          <span className="display">Strava verbinden</span>
          <p className="muted">Deine Läufe, Radfahrten, Schwimm-Einheiten und Wanderungen erscheinen dann hier, mit Distanz, Dauer, Pace und Ø-Puls. Anderer Sport wie Padel oder Yoga landet unter Other Sports.</p>
          <button className="btn dark" onClick={connect} disabled={!stravaAvailable}>
            Mit Strava verbinden
          </button>
        </div>
      ) : !link.connected ? (
        <div className="callout">
          <span className="display">Noch nicht verbunden</span>
          <p className="muted">
            {result === 'error' ? 'Strava ist gerade nicht erreichbar. Versuch es gleich noch einmal.' : 'Melde dich bei Strava an und erlaube den Zugriff. Danach hier auf „Prüfen“ tippen.'}
          </p>
          <div className="btn-row">
            <button className="btn outline" onClick={connect}>
              Verbinden
            </button>
            <button className="btn dark" onClick={refresh} disabled={busy}>
              {busy ? 'Prüft …' : 'Prüfen'}
            </button>
          </div>
        </div>
      ) : (
        <>
          <Chips label="Sportart filtern" options={FILTERS.map((f) => ({ value: f, label: f === 'all' ? 'Alle' : ACTIVITY_LABEL[f] }))} value={filter} onChange={setFilter} />
          {result === 'error' ? <p className="muted small">Aktualisieren hat nicht geklappt. Strava ist gerade nicht erreichbar.</p> : null}
          {acts.length ? (
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
                    {a.elevM && a.elevM >= 10 ? <span className="small muted">↑ {Math.round(a.elevM)} Höhenmeter</span> : null}
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="muted">Keine Aktivitäten {filter === 'all' ? '' : `für ${ACTIVITY_LABEL[filter as ActivityType]} `}gefunden.</p>
          )}
          <p className="muted small">
            Verbunden{link.athlete ? ` als ${link.athlete}` : ''}
            {link.lastSync ? ` · aktualisiert ${relativeDay(link.lastSync)}, ${shortTime(link.lastSync)}` : ''}
          </p>
          <button className="btn danger" onClick={disconnect}>
            Strava trennen
          </button>
        </>
      )}
    </main>
  )
}
