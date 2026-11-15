import { useEffect, useState, type ReactNode } from 'react'

const paths = {
  back: 'M15 18l-6-6 6-6',
  chevron: 'M9 6l6 6-6 6',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  up: 'M6 15l6-6 6 6',
  down: 'M6 9l6 6 6-6',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  backup: 'M12 4v11m0 0l-4-4m4 4l4-4M5 20h14',
  bolt: 'M13 3L5 13h6l-1 8 8-10h-6z',
  dumbbell: 'M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11',
  pulse: 'M3 12h4l2.5-6 5 12 2.5-6h4',
  ball: 'M12 3.5a8.5 8.5 0 1 0 0 17a8.5 8.5 0 1 0 0-17M5 7.5c3 1.5 4.5 4.5 4.5 9M19 7.5c-3 1.5-4.5 4.5-4.5 9',
  note: 'M6 3.5h9l3 3v14H6zM9 11h6M9 15h4',
  chart: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
}

export type IconName = keyof typeof paths

export function Icon({ name, size = 22, stroke = 2.2 }: { name: IconName; size?: number; stroke?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
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

/** Leitet um, wenn ein Screen sein Objekt nicht (mehr) findet */
export function Redirect({ to }: { to: string }) {
  useEffect(() => {
    go(to)
  }, [to])
  return null
}

interface HeaderProps {
  title: string
  back?: { label: string; to: string } | { label: string; onClick: () => void }
  right?: ReactNode
  kicker?: string
}

export function Header({ title, back, right, kicker }: HeaderProps) {
  return (
    <header className="header">
      {back || right ? (
        <div className="header-bar">
          {back ? (
            <button className="back" onClick={'to' in back ? () => go(back.to) : back.onClick}>
              <Icon name="back" size={20} />
              {back.label}
            </button>
          ) : (
            <span />
          )}
          {right}
        </div>
      ) : null}
      {kicker ? <span className="kicker">{kicker}</span> : null}
      <h1 className="display">{title}</h1>
    </header>
  )
}

export function Sheet({ open, onClose, children, title }: { open: boolean; onClose: () => void; children: ReactNode; title?: string }) {
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])
  if (!open) return null
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={title}>
        <div className="sheet-grip" />
        {title ? <h2 className="display sheet-title">{title}</h2> : null}
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
  const show = (v: number) => String(v).replace('.', ',')
  const [text, setText] = useState(show(value))
  useEffect(() => setText(show(value)), [value])

  const commit = (s: string) => {
    const n = parseFloat(s.replace(',', '.'))
    if (Number.isFinite(n)) onChange(Math.max(min, n))
    else setText(show(value))
  }
  const bump = (d: number) => onChange(Math.max(min, Math.round((value + d) * 100) / 100))

  return (
    <div className="stepper">
      <span className="label">{label}</span>
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

export function Chips<T extends string | number>({ options, value, onChange, label }: { options: { value: T; label: string }[]; value: T | undefined; onChange: (v: T) => void; label: string }) {
  return (
    <div className="chips" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={String(o.value)} className={`chip${o.value === value ? ' on' : ''}`} aria-pressed={o.value === value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="empty">
      <p className="display">{title}</p>
      {children ? <p className="muted">{children}</p> : null}
    </div>
  )
}
