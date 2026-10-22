import { useEffect, useState, type ReactNode } from 'react'

const paths = {
  back: 'M15 18l-6-6 6-6',
  edit: 'M4 20h4L18.5 9.5a2.1 2.1 0 0 0-4-4L4 16v4z',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  up: 'M6 15l6-6 6 6',
  down: 'M6 9l6 6 6-6',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  backup: 'M12 4v11m0 0l-4-4m4 4l4-4M5 20h14',
  close: 'M6 6l12 12M18 6L6 18',
}

export function Icon({ name, size = 22 }: { name: keyof typeof paths; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={paths[name]} />
    </svg>
  )
}

export function useHash() {
  const [hash, setHash] = useState(location.hash)
  useEffect(() => {
    const on = () => {
      setHash(location.hash)
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return hash.replace(/^#\/?/, '')
}

export const go = (path: string) => (location.hash = path ? `/${path}` : '')

export function Header({ title, back, right }: { title: string; back?: () => void; right?: ReactNode }) {
  return (
    <header className="header">
      {back ? (
        <button className="icon-btn" onClick={back} aria-label="Zurück">
          <Icon name="back" />
        </button>
      ) : null}
      <h1 className={back ? 'small' : ''}>{title}</h1>
      <div className="header-right">{right}</div>
    </header>
  )
}

export function Sheet({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
  }, [open])
  if (!open) return null
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()} role="dialog">
        <div className="sheet-grip" />
        {children}
      </div>
    </div>
  )
}

interface StepperProps {
  label: string
  unit?: string
  value: number
  step: number
  min?: number
  onChange: (v: number) => void
}

/** Zahl mit großen −/+ Buttons; die Zahl selbst ist direkt tippbar */
export function Stepper({ label, unit, value, step, min = 0, onChange }: StepperProps) {
  const [text, setText] = useState(String(value))
  useEffect(() => setText(String(value).replace('.', ',')), [value])

  const commit = (s: string) => {
    const n = parseFloat(s.replace(',', '.'))
    if (Number.isFinite(n)) onChange(Math.max(min, n))
    else setText(String(value).replace('.', ','))
  }
  const bump = (d: number) => onChange(Math.max(min, Math.round((value + d) * 100) / 100))

  return (
    <div className="stepper">
      <span className="stepper-label">{label}</span>
      <div className="stepper-row">
        <button className="step-btn" onClick={() => bump(-step)} aria-label={`${label} verringern`}>
          <Icon name="minus" size={20} />
        </button>
        <label className="stepper-value">
          <input
            inputMode="decimal"
            value={text}
            onFocus={(e) => e.target.select()}
            onChange={(e) => setText(e.target.value)}
            onBlur={(e) => commit(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
            aria-label={label}
          />
          {unit ? <span className="unit">{unit}</span> : null}
        </label>
        <button className="step-btn" onClick={() => bump(step)} aria-label={`${label} erhöhen`}>
          <Icon name="plus" size={20} />
        </button>
      </div>
    </div>
  )
}
