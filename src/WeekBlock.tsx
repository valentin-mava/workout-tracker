import { formatHours, formatKm, isoWeek, weekSummary, type ItemKind } from './format'
import { useStore } from './store'
import { go, Icon } from './ui'

const DAY_LABELS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

/** Schwarzer Wochenblock: Overview zeigt Tagespunkte, Tracker blättert durch die Wochen */
export function WeekBlock({ start, onNav }: { start: Date; onNav?: (dir: -1 | 1) => void }) {
  const { data } = useStore()
  const s = weekSummary(data, start)
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  const range = `${start.getDate()}.${start.getMonth() + 1}. – ${end.getDate()}.${end.getMonth() + 1}.`
  const isCurrent = Date.now() - start.getTime() < 7 * 86_400_000 && Date.now() >= start.getTime()
  const todayIdx = (new Date().getDay() + 6) % 7

  // Pro Tag die "stärkste" Aktivität: Gym vor Cardio vor Other
  const kinds: (ItemKind | null)[] = DAY_LABELS.map(() => null)
  const rank: Record<ItemKind, number> = { gym: 3, cardio: 2, other: 1 }
  for (const i of s.items) {
    const d = (new Date(i.date).getDay() + 6) % 7
    if (!kinds[d] || rank[i.kind] > rank[kinds[d]!]) kinds[d] = i.kind
  }

  return (
    <section className="week" aria-label="Wochenzusammenfassung">
      {onNav ? (
        <div className="week-nav">
          <button className="icon-btn" onClick={() => onNav(-1)} aria-label="Vorherige Woche">
            <Icon name="back" />
          </button>
          <div className="week-title">
            <span className="display">{isCurrent ? 'Diese Woche' : `Woche ${isoWeek(start)}`}</span>
            <span>{range}</span>
          </div>
          <button className="icon-btn" onClick={() => onNav(1)} disabled={isCurrent} aria-label="Nächste Woche">
            <Icon name="chevron" />
          </button>
        </div>
      ) : (
        <>
          <div className="week-head">
            <span className="kicker">Woche {isoWeek(start)}</span>
            <button className="week-link" onClick={() => go('tracker')}>
              Details
            </button>
          </div>
          <div className="days">
            {DAY_LABELS.map((l, i) => (
              <div key={l}>
                {l}
                <span className={`dot${kinds[i] ? ` ${kinds[i]}` : ''}${isCurrent && i === todayIdx ? ' today' : ''}`} />
              </div>
            ))}
          </div>
        </>
      )}
      <div className={`stats${onNav ? ' center' : ''}`}>
        <div className={`stat${onNav ? ' hl' : ''}`}>
          <strong>{s.workouts}</strong>
          <span>Workouts</span>
        </div>
        <div className="stat">
          <strong>{s.runs}</strong>
          <span>Läufe</span>
        </div>
        <div className="stat">
          <strong>{formatKm(s.km)}</strong>
          <span>km</span>
        </div>
        <div className="stat">
          <strong>{formatHours(s.minutes)}</strong>
          <span>Stunden</span>
        </div>
      </div>
    </section>
  )
}
