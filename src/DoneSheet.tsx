import { useState, type ReactNode } from 'react'
import { fromDateInput, toDateInput } from './format'
import { Sheet } from './ui'

interface Props {
  open: boolean
  title: string
  onClose: () => void
  onSave: (date: string, durationMinutes: number | undefined) => void
  children?: ReactNode
}

/** Abschluss eines Trainings: Datum (Standard heute) und optionale Dauer */
export function DoneSheet({ open, title, onClose, onSave, children }: Props) {
  return (
    <Sheet open={open} onClose={onClose} title={title}>
      {open ? <DoneForm onSave={onSave} onClose={onClose} extra={children} /> : null}
    </Sheet>
  )
}

function DoneForm({ onSave, onClose, extra }: { onSave: Props['onSave']; onClose: () => void; extra?: ReactNode }) {
  const [date, setDate] = useState(toDateInput(new Date().toISOString()))
  const [duration, setDuration] = useState('')
  const minutes = parseInt(duration, 10)

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
      <button className="btn accent wide" disabled={!date} onClick={() => onSave(fromDateInput(date), minutes > 0 ? minutes : undefined)}>
        Speichern
      </button>
      <button className="btn ghost" onClick={onClose}>
        Abbrechen
      </button>
    </div>
  )
}
