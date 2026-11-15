import type { ReactNode } from 'react'
import { formatKg, hasWeight, setsReps, TOOL_LABEL } from './format'
import type { Exercise } from './types'

/** Übungszeile wie im Entwurf: Nummer, Name, Tool-Tag, Sets × Reps groß, kg darunter */
export function ExerciseRow({ ex, index, onClick, aside }: { ex: Exercise; index: number; onClick?: () => void; aside?: ReactNode }) {
  const body = (
    <>
      <span className="ex-num">{String(index + 1).padStart(2, '0')}</span>
      <span className="ex-main">
        <span className="ex-name">{ex.name}</span>
        {ex.tool || ex.note ? (
          <span className="ex-meta">
            {ex.tool ? <span className="tag">{TOOL_LABEL[ex.tool]}</span> : null}
            {ex.note ? <span className="ex-note">{ex.note}</span> : null}
          </span>
        ) : null}
      </span>
      <span className="ex-values">
        <strong>{setsReps(ex)}</strong>
        <span>{hasWeight(ex) ? formatKg(ex.weight!) : ex.tool === 'bodyweight' ? 'Körpergewicht' : ''}</span>
      </span>
    </>
  )
  return (
    <li className="exercise">
      {onClick ? (
        <button className="ex-body" onClick={onClick}>
          {body}
        </button>
      ) : (
        <div className="ex-body">{body}</div>
      )}
      {aside}
    </li>
  )
}
