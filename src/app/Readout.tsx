import { useState } from 'react'
import { LENGTH_UNITS, PLANE_ANGLE_LIMIT_DEG, type LengthUnit, type TopLengthAxis } from '../math'
import { inkLabel, inkStroke } from './palette'
import { buildReport } from './report'
import type { Annotation, AreaAnn, MeasureAnn, PlateDoc } from './types'

export function Readout({
  doc,
  unit,
  selectedId,
  onSelect,
  onChangeMeasure,
  onChangeArea,
  onLock,
  onDelete,
  onCopy,
}: {
  doc: PlateDoc
  unit: LengthUnit
  selectedId: string | null
  onSelect: (id: string) => void
  onChangeMeasure: (id: string, patch: Partial<MeasureAnn>) => void
  onChangeArea: (id: string, patch: Partial<Pick<AreaAnn, 'turnDeg' | 'lengthAxis'>>) => void
  onLock: (id: string) => void
  onDelete: (id: string) => void
  onCopy: () => void
}) {
  const report = buildReport(doc, unit)
  return (
    <aside className="readout" aria-label="Readings">
      <h2>SCALE</h2>
      <p className="scale-line" data-scale={report.pxPerM ?? ''}>
        {report.pxPerM == null
          ? report.locked
            ? 'Locked scale is not usable'
            : 'Pixels only — lock a reference'
          : report.horizon
            ? `${report.pxPerM.toFixed(2)} px/m at the locks · horizon shifts it`
            : `${report.pxPerM.toFixed(2)} px/m`}
      </p>
      <p className="note">{report.horizon ? 'Only the horizon changes scale.' : 'A waterline never changes scale.'}</p>
      {report.flags.map((flag) => (
        <p key={flag} className="flag">
          {flag}
        </p>
      ))}
      <h2>LENGTHS</h2>
      {report.measures.length === 0 && report.cylinders.length === 0 ? (
        <p className="note">Draw a reference across a known length, then measure the rest.</p>
      ) : null}
      {report.measures.map((row) => {
        const ann = doc.annotations.find((item) => item.id === row.id)
        const selected = selectedId === row.id
        return (
          <article
            key={row.id}
            className="row"
            data-measure={row.id}
            data-metres={row.metres ?? ''}
            onClick={() => onSelect(row.id)}
          >
            <header>
              <Mark ann={ann} letter={row.mark} tone={row.tone} />
              <div>
                <div>{row.label}</div>
                <div className="primary">{row.primary}</div>
                {row.pair ? <p className="pair">{row.pair}</p> : null}
                {row.barText ? <p className="note">{row.barText}</p> : null}
                {row.warning && !/^Angle not set\./i.test(row.warning) ? <p className="warn-line">{row.warning}</p> : null}
              </div>
            </header>
            {selected && ann?.kind === 'measure' ? (
              <MeasureFields ann={ann} onChange={(patch) => onChangeMeasure(ann.id, patch)} onLock={() => onLock(ann.id)} onDelete={() => onDelete(ann.id)} />
            ) : null}
          </article>
        )
      })}
      {report.cylinders.map((row) => {
        const ann = doc.annotations.find((item) => item.id === row.id)
        return (
        <article key={row.id} className="row" onClick={() => onSelect(row.id)}>
          <header>
            <Mark ann={ann} letter={row.name.slice(0, 1)} />
            <div>
              <div>{row.name}</div>
              <div className="primary">{row.text}</div>
              <p className="note">{row.note}</p>
            </div>
          </header>
          {selectedId === row.id ? (
            <div className="row-actions">
              <button type="button" className="linkish" onClick={() => onLock(row.id)}>
                Lock diameter
              </button>
              <button type="button" className="linkish" onClick={() => onDelete(row.id)}>
                Delete
              </button>
            </div>
          ) : null}
        </article>
        )
      })}
      <h2>AREA</h2>
      {report.areas.length === 0 ? <p className="note">Area is the face as it appears, until you type a turn.</p> : null}
      {report.areas.map((row) => {
        const ann = doc.annotations.find((item) => item.id === row.id)
        return (
          <article key={row.id} className="row" onClick={() => onSelect(row.id)}>
            <header>
              <Mark ann={ann} letter={row.mark} />
              <div>
                <div>{row.facing} face</div>
                <div className="primary">{row.primary}</div>
                {row.warning ? <p className="warn-line">{row.warning}</p> : null}
              </div>
            </header>
            {selectedId === row.id && ann?.kind === 'area' ? (
              <div className="fields">
                <DegreesField
                  label="Turn out of the picture, degrees"
                  placeholder="optional"
                  value={ann.turnDeg}
                  onChange={(turnDeg) => onChangeArea(row.id, { turnDeg })}
                />
                {ann.facing === 'top' ? (
                  <label>
                    Length on this top view
                    <select
                      value={ann.lengthAxis ?? ''}
                      onChange={(event) => {
                        const value = event.target.value
                        const lengthAxis: TopLengthAxis | null = value === 'x' || value === 'y' ? value : null
                        onChangeArea(row.id, { lengthAxis })
                      }}
                    >
                      <option value="">Match the other faces</option>
                      <option value="x">Runs left-right</option>
                      <option value="y">Runs up-down</option>
                    </select>
                  </label>
                ) : null}
                <button type="button" className="linkish" onClick={() => onDelete(row.id)}>
                  Delete
                </button>
              </div>
            ) : null}
          </article>
        )
      })}
      <h2>VOLUME</h2>
      {report.prisms.map((row) => (
        <article key={row.id} className="row">
          <div>{row.name}</div>
          {row.text ? <div className="primary">{row.text}</div> : null}
          <p className="note">{row.note}</p>
        </article>
      ))}
      <button type="button" className="text-btn" onClick={onCopy}>
        Copy report
      </button>
      <p className="note">Unit now showing: {LENGTH_UNITS.includes(unit) ? unit : unit}. Lens distortion is not in the bar.</p>
    </aside>
  )
}

function Mark({ ann, letter, tone }: { ann: Annotation | undefined; letter: string; tone?: string }) {
  const stroke = inkStroke(ann?.color)
  const toneClass = tone === 'red' ? ' bad' : tone === 'amber' ? ' warn' : ''
  return (
    <span className={`mark${toneClass}`} style={{ background: stroke, color: inkLabel(stroke) }}>
      {letter}
    </span>
  )
}

function DegreesField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: number | null | undefined
  onChange: (value: number | null) => void
  placeholder?: string
}) {
  const shown = value == null || Number.isNaN(value) ? null : value
  const [text, setText] = useState(shown == null ? '' : String(shown))
  const [seen, setSeen] = useState(shown)
  if (seen !== shown) {
    setSeen(shown)
    setText(shown == null ? '' : String(shown))
  }
  return (
    <label>
      {label}
      <input
        type="number"
        min={-PLANE_ANGLE_LIMIT_DEG}
        max={PLANE_ANGLE_LIMIT_DEG}
        step="any"
        placeholder={placeholder}
        value={text}
        onChange={(event) => {
          const raw = event.target.value
          setText(raw)
          if (raw.trim() === '') {
            onChange(null)
            return
          }
          const angle = Number(raw)
          if (!Number.isFinite(angle)) return
          onChange(angle)
        }}
      />
    </label>
  )
}

function MeasureFields({
  ann,
  onChange,
  onLock,
  onDelete,
}: {
  ann: MeasureAnn
  onChange: (patch: Partial<MeasureAnn>) => void
  onLock: () => void
  onDelete: () => void
}) {
  return (
    <div className="fields">
      <DegreesField
        label="Angle out of the plane, degrees"
        placeholder="optional — blank leaves it uncorrected"
        value={ann.angleDeg}
        onChange={(angleDeg) => onChange({ angleDeg })}
      />
      <label>
        Doubt in that angle, degrees
        <input
          type="number"
          min="0"
          step="any"
          value={ann.angleUncertaintyDeg ?? ''}
          onChange={(event) => {
            if (event.target.value === '') {
              onChange({ angleUncertaintyDeg: null })
              return
            }
            const doubt = Number(event.target.value)
            if (!Number.isFinite(doubt) || doubt < 0) return
            onChange({ angleUncertaintyDeg: doubt })
          }}
        />
      </label>
      <label>
        Plane
        <select
          value={ann.plane ?? ''}
          onChange={(event) => {
            const value = event.target.value
            onChange({ plane: value === '' ? null : (value as MeasureAnn['plane']) })
          }}
        >
          <option value="">Not set</option>
          <option value="same">Same plane as the scale</option>
          <option value="off">Off the plane</option>
        </select>
      </label>
      <div className="row-actions">
        <button type="button" className="linkish" onClick={onLock}>
          {ann.knownMetres ? 'Change lock' : 'Lock length'}
        </button>
        <button type="button" className="linkish" onClick={onDelete}>
          Delete
        </button>
      </div>
    </div>
  )
}
