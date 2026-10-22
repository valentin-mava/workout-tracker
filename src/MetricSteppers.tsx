import { DEFAULTS, METRIC_LABEL, STEP } from './format'
import { METRICS, type Metric, type Values } from './types'
import { Stepper } from './ui'

const UNIT: Record<Metric, string | undefined> = { sets: undefined, reps: undefined, weight: 'kg', time: 's' }

/** Stepper für alle Werte, die diese Übung erfasst */
export function MetricSteppers({ values, track, onChange }: { values: Values; track: Metric[]; onChange: (v: Values) => void }) {
  const shown = METRICS.filter((m) => track.includes(m))
  if (!shown.length) return null
  return (
    <div className={`steppers n${shown.length}`}>
      {shown.map((m) => (
        <Stepper
          key={m}
          label={METRIC_LABEL[m]}
          unit={UNIT[m]}
          step={STEP[m]}
          min={m === 'sets' ? 1 : 0}
          value={values[m] ?? DEFAULTS[m]}
          onChange={(v) => onChange({ ...values, [m]: v })}
        />
      ))}
    </div>
  )
}
