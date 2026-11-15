import { useState } from 'react'
import { formatMinutes, fromDateInput, relativeDay, SPORTS, toDateInput } from '../format'
import { uid, useStore } from '../store'
import type { SportLog, SportPreset } from '../types'
import { Empty, go, Header, Icon, Sheet, Stepper } from '../ui'

interface Form {
  /** gesetzt beim Bearbeiten eines Eintrags */
  logId?: string
  /** gesetzt, wenn aus einer Vorlage gestartet */
  presetId?: string
  sport: string
  date: string
  durationMinutes: number
  intensity: number
  note: string
}

const blank = (): Form => ({ sport: '', date: toDateInput(new Date().toISOString()), durationMinutes: 30, intensity: 3, note: '' })

export function Sports({ editId }: { editId?: string }) {
  const { data } = useStore()
  const initial = (): Form | null => {
    const log = editId ? data.sportLogs.find((s) => s.id === editId) : null
    return log ? { logId: log.id, sport: log.sport, date: toDateInput(log.date), durationMinutes: log.durationMinutes, intensity: log.intensity, note: log.note ?? '' } : null
  }
  const [form, setForm] = useState<Form | null>(initial)

  const logs = [...data.sportLogs].sort((a, b) => b.date.localeCompare(a.date))

  const fromPreset = (p: SportPreset) => setForm({ ...blank(), presetId: p.id, sport: p.sport, durationMinutes: p.durationMinutes, intensity: p.intensity, note: p.note ?? '' })

  const close = () => {
    setForm(null)
    if (editId) go('sports')
  }

  return (
    <main className="screen">
      <Header back={{ label: 'Overview', to: '' }} title="Other Sports" />

      <button className="btn dark wide" onClick={() => setForm(blank())}>
        <Icon name="plus" size={18} stroke={2.4} /> Eintragen
      </button>

      {data.sportPresets.length ? (
        <section className="section">
          <span className="section-title">Gespeichert · ein Tipp zum Eintragen</span>
          <div className="chips">
            {data.sportPresets.map((p) => (
              <button key={p.id} className="chip" onClick={() => fromPreset(p)}>
                {p.sport} · {formatMinutes(p.durationMinutes)}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {logs.length ? (
        <section className="section">
          <span className="section-title">Verlauf</span>
          <ul className="table">
            {logs.map((s) => (
              <li key={s.id}>
                <button className="table-row" onClick={() => setForm({ logId: s.id, sport: s.sport, date: toDateInput(s.date), durationMinutes: s.durationMinutes, intensity: s.intensity, note: s.note ?? '' })}>
                  <span className="name">
                    {s.sport}
                    <span className="row-sub" style={{ display: 'block', fontWeight: 400 }}>
                      {relativeDay(s.date)} · {s.intensity ? `Intensität ${s.intensity}` : 'Intensität ergänzen'}
                      {s.source === 'strava' ? ' · Strava' : ''}
                      {s.note ? ` · ${s.note}` : ''}
                    </span>
                  </span>
                  <span className="val">{formatMinutes(s.durationMinutes)}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <Empty title="Noch nichts eingetragen">Mobility, Stretching, Padel, Wandern: Dauer und Intensität reichen.</Empty>
      )}

      <Sheet open={!!form} onClose={close} title={form?.logId ? 'Eintrag bearbeiten' : 'Other Sports'}>
        {form ? <SportForm key={form.logId ?? form.presetId ?? 'new'} initial={form} onDone={close} /> : null}
      </Sheet>
    </main>
  )
}

function SportForm({ initial, onDone }: { initial: Form; onDone: () => void }) {
    const { data, update } = useStore()
    const [f, setF] = useState(initial)
    const [asPreset, setAsPreset] = useState(false)
    const set = (patch: Partial<Form>) => setF({ ...f, ...patch })
    const sport = f.sport.trim()

    const save = () => {
      // Unverändertes Datum behält die ursprüngliche Uhrzeit
      const prev = data.sportLogs.find((s) => s.id === f.logId)
      const log: SportLog = {
        id: f.logId ?? uid(),
        sport,
        date: prev && f.date === toDateInput(prev.date) ? prev.date : fromDateInput(f.date),
        durationMinutes: f.durationMinutes,
        intensity: f.intensity,
        note: f.note.trim() || undefined,
        source: prev?.source,
      }
      update((d) => ({
        ...d,
        sportLogs: f.logId ? d.sportLogs.map((s) => (s.id === f.logId ? log : s)) : [...d.sportLogs, log],
        sportPresets: asPreset ? [...d.sportPresets, { id: uid(), sport, durationMinutes: f.durationMinutes, intensity: f.intensity, note: log.note }] : d.sportPresets,
      }))
      onDone()
    }

    const remove = () => {
      if (!confirm('Eintrag löschen?')) return
      update((d) => ({ ...d, sportLogs: d.sportLogs.filter((s) => s.id !== f.logId) }))
      onDone()
    }

    const removePreset = () => {
      if (!confirm(`Vorlage „${initial.sport}“ löschen?`)) return
      update((d) => ({ ...d, sportPresets: d.sportPresets.filter((p) => p.id !== f.presetId) }))
      onDone()
    }

    return (
      <div className="form">
        <div className="field-wrap">
          <input className="field" value={f.sport} placeholder="Sportart, z. B. Mobility Flow" aria-label="Sportart" onChange={(e) => set({ sport: e.target.value })} />
          <div className="chips">
            {SPORTS.map((s) => (
              <button key={s} className={`chip${f.sport === s ? ' on' : ''}`} onClick={() => set({ sport: s })}>
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="form-2">
          <label className="field-wrap">
            <span className="label">Datum</span>
            <input className="field" type="date" value={f.date} max={toDateInput(new Date().toISOString())} onChange={(e) => set({ date: e.target.value })} />
          </label>
          <Stepper label="Dauer" unit="min" value={f.durationMinutes} step={5} min={5} onChange={(durationMinutes) => set({ durationMinutes })} />
        </div>

        <div className="field-wrap">
          <span className="label">Intensität</span>
          <div className="scale" role="group" aria-label="Intensität 1 bis 5">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} className={`chip${f.intensity === n ? ' on' : ''}`} aria-pressed={f.intensity === n} onClick={() => set({ intensity: n })}>
                {n}
              </button>
            ))}
          </div>
        </div>

        <textarea className="field" rows={2} value={f.note} placeholder="Notiz (optional)" onChange={(e) => set({ note: e.target.value })} />

        {!f.logId && !f.presetId ? (
          <label className="check-row">
            <input type="checkbox" checked={asPreset} onChange={(e) => setAsPreset(e.target.checked)} />
            Als Vorlage speichern
          </label>
        ) : null}

        <button className="btn accent wide" disabled={!sport || !f.date} onClick={save}>
          Speichern
        </button>
        {f.logId ? (
          <button className="btn danger" onClick={remove}>
            Eintrag löschen
          </button>
        ) : f.presetId ? (
          <button className="btn danger" onClick={removePreset}>
            Vorlage löschen
          </button>
        ) : null}
      </div>
    )
}
