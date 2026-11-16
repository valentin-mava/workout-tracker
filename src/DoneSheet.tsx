import { useState, type ReactNode } from 'react'
import { fromDateInput, toDateInput } from './format'
import { Sheet } from './ui'

interface Props {
  open: boolean
  title: string
  onClose: () => void
  onSave: (date: string, durationMinutes: number | undefined) => void
  children?: ReactNode
  /** Beim Bearbeiten: bisheriges Datum (ISO) und Dauer */
  initial?: { date: string; durationMinutes?: number }
}

/** Abschluss eines Trainings: Datum (Standard heute) und optionale Dauer */
export function DoneSheet({ open, title, onClose, onSave, children, initial }: Props) {
  return (
    <Sheet open={open} onClose={onClose} title={title}>
      {open ? <DoneForm onSave={onSave} onClose={onClose} extra={children} initial={initial} /> : null}
    </Sheet>
  )
}

function DoneForm({ onSave, onClose, extra, initial }: { onSave: Props['onSave']; onClose: () => void; extra?: ReactNode; initial?: Props['initial'] }) {
  const [date, setDate] = useState(toDateInput(initial?.date ?? new Date().toISOString()))
  const [duration, setDuration] = useState(initial?.durationMinutes ? String(initial.durationMinutes) : '')
  const minutes = parseInt(duration, 10)
  // Unverändertes Datum behält die ursprüngliche Uhrzeit
  const isoDate = () => (initial && date === toDateInput(initial.date) ? initial.date : fromDateInput(date))

  return (
    <div className="form">
      <div className="form-2">
        <label className="field-wrap">
          <span className="label">Datum</span>
          <input className="field" type="date" value={date} max={toDateInput(new Date().toISOString())} onChange={(e) => setDate(e.target.value)} />
        </label>
        <label className="field-wrap">
          <span className="label">Dauer (optional)</span>
          <input className="field" inputMode="numeric" placeholder="– min" value={duration} onChange={(e) => setDuration(e.target.value.replace(/\D/g, ''))} />
        </label>
      </div>
      {extra}
      <button className="btn accent wide" disabled={!date} onClick={() => onSave(isoDate(), minutes > 0 ? minutes : undefined)}>
        Speichern
      </button>
      <button className="btn ghost" onClick={onClose}>
        Abbrechen
      </button>
    </div>
  )
}
