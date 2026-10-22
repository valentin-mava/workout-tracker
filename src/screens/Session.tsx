import { useEffect, useMemo, useState } from 'react'
import { formatWeight, relativeDay, summary } from '../format'
import { MetricSteppers } from '../MetricSteppers'
import { useStore } from '../store'
import type { Draft, Session as SessionT, SessionEntry, Values } from '../types'
import { go, Header, Icon, Sheet, Stepper } from '../ui'

const minutesSince = (iso: string) => Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60_000))

export function Session() {
  const { data, update } = useStore()
  const draft = data.draft
  const [finishing, setFinishing] = useState(false)
  const [elapsed, setElapsed] = useState(() => (draft ? minutesSince(draft.date) : 0))
  const [duration, setDuration] = useState(elapsed)

  useEffect(() => {
    if (!draft) return
    const t = setInterval(() => setElapsed(minutesSince(draft.date)), 30_000)
    return () => clearInterval(t)
  }, [draft])

  const workout = data.workouts.find((w) => w.id === draft?.workoutId)
  const notes = useMemo(() => new Map(workout?.exercises.map((e) => [e.id, e.note])), [workout])

  // Letzte erledigte Werte pro Übung, damit du siehst, wo du weitermachst
  const last = useMemo(() => {
    const m = new Map<string, { v: SessionEntry; date: string }>()
    for (const s of data.sessions) {
      for (const e of s.entries) {
        const prev = m.get(e.exerciseId)
        if (e.done && (!prev || s.date > prev.date)) m.set(e.exerciseId, { v: e, date: s.date })
      }
    }
    return m
  }, [data.sessions])

  if (!draft) {
    go('')
    return null
  }

  const setDraft = (fn: (d: Draft) => Draft) => update((d) => (d.draft ? { ...d, draft: fn(d.draft) } : d))
  const setEntry = (i: number, patch: Partial<SessionEntry>) =>
    setDraft((d) => ({ ...d, entries: d.entries.map((e, j) => (j === i ? { ...e, ...patch } : e)) }))

  const doneCount = draft.entries.filter((e) => e.done).length

  const openFinish = () => {
    setDuration(minutesSince(draft.date))
    setFinishing(true)
  }

  const save = () => {
    // Nur die Werte speichern, die die Übung auch erfasst
    const entries = draft.entries.map((e) => {
      const clean: SessionEntry = { exerciseId: e.exerciseId, exerciseName: e.exerciseName, track: e.track, done: e.done }
      for (const m of e.track) clean[m] = e[m]
      return clean
    })
    const session: SessionT = { ...draft, entries, durationMinutes: duration }
    update((d) => ({ ...d, sessions: [...d.sessions, session], draft: null }))
    go('')
  }

  const discard = () => {
    if (!confirm('Training verwerfen? Nichts wird gespeichert.')) return
    update((d) => ({ ...d, draft: null }))
    go('')
  }

  return (
    <main className="screen with-footer">
      <Header title={draft.workoutName || 'Training'} back={() => go('')} right={<span className="timer">{elapsed} min</span>} />

      <ul className="cards">
        {draft.entries.map((e, i) => {
          const prev = last.get(e.exerciseId)
          const delta = prev && e.track.includes('weight') && prev.v.weight != null && e.weight != null ? e.weight - prev.v.weight : 0
          return (
            <li key={e.exerciseId} className={`card entry${e.done ? ' done' : ''}`}>
              <div className="entry-head">
                <button className={`check${e.done ? ' on' : ''}`} onClick={() => setEntry(i, { done: !e.done })} aria-pressed={e.done} aria-label={`${e.exerciseName} abhaken`}>
                  <Icon name="check" size={22} />
                </button>
                <div className="entry-title">
                  <span className="card-title">{e.exerciseName}</span>
                  {notes.get(e.exerciseId) ? <span className="card-note">{notes.get(e.exerciseId)}</span> : null}
                  <span className="card-meta">
                    {prev ? `Zuletzt ${relativeDay(prev.date)}: ${summary(prev.v, e.track) || '✓'}` : 'Zum ersten Mal'}
                    {delta > 0 ? <span className="up"> +{formatWeight(delta)}</span> : null}
                  </span>
                </div>
              </div>
              {!e.done ? <MetricSteppers values={e} track={e.track} onChange={(v: Values) => setEntry(i, v)} /> : <p className="entry-summary">{summary(e, e.track) || 'Erledigt'}</p>}
            </li>
          )
        })}
      </ul>

      <footer className="footer">
        <button className="btn primary wide" onClick={openFinish}>
          Training beenden · {doneCount}/{draft.entries.length}
        </button>
      </footer>

      <Sheet open={finishing} onClose={() => setFinishing(false)}>
        <div className="form">
          <h2>Training beenden</h2>
          <p className="muted">
            {doneCount} von {draft.entries.length} Übungen erledigt.
            {doneCount < draft.entries.length ? ' Nicht abgehakte Übungen zählen nicht als letzter Stand.' : ''}
          </p>
          <Stepper label="Dauer im Gym" unit="min" value={duration} step={5} min={1} onChange={setDuration} />
          <button className="btn primary wide" onClick={save}>
            Speichern
          </button>
          <button className="btn danger-link" onClick={discard}>
            Training verwerfen
          </button>
        </div>
      </Sheet>
    </main>
  )
}
