import type { LengthUnit } from '../math'
import { LENGTH_UNITS } from '../math'
import { buildReport } from './report'
import type { MeasureAnn, PlateDoc } from './types'

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
  onChangeArea: (id: string, turnDeg: number | null) => void
  onLock: (id: string) => void
  onDelete: (id: string) => void
  onCopy: () => void
}) {
  const report = buildReport(doc, unit)
  return (
    <aside className="readout" aria-label="Readings">
      <h2>SCALE</h2>
      <p className="scale-line" data-scale={report.pxPerM ?? ''}>
        {report.locked
          ? report.horizon
            ? `${report.pxPerM?.toFixed(2)} px/m at the locks · horizon shifts it`
            : `${report.pxPerM?.toFixed(2)} px/m`
          : 'Pixels only — lock a reference'}
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
              <span className={row.tone === 'red' ? 'mark bad' : row.tone === 'amber' ? 'mark warn' : 'mark'}>{row.mark}</span>
              <div>
                <div>{row.label}</div>
                <div className="primary">{row.primary}</div>
                {row.pair ? <p className="pair">{row.pair}</p> : null}
                {row.barText ? <p className="note">{row.barText}</p> : null}
              </div>
            </header>
            {selected && ann?.kind === 'measure' ? (
              <MeasureFields ann={ann} onChange={(patch) => onChangeMeasure(ann.id, patch)} onLock={() => onLock(ann.id)} onDelete={() => onDelete(ann.id)} />
            ) : null}
          </article>
        )
      })}
      {report.cylinders.map((row) => (
        <article key={row.id} className="row" onClick={() => onSelect(row.id)}>
          <header>
            <span className="mark">{row.name.slice(0, 1)}</span>
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
      ))}
      <h2>AREA</h2>
      {report.areas.length === 0 ? <p className="note">Area is the face as it appears, until you type a turn.</p> : null}
      {report.areas.map((row) => (
        <article key={row.id} className="row" onClick={() => onSelect(row.id)}>
          <header>
            <span className="mark">{row.mark}</span>
            <div>
              <div>
                {row.facing} face
              </div>
              <div className="primary">{row.primary}</div>
              {row.warning ? <p className="warn-line">{row.warning}</p> : null}
            </div>
          </header>
          {selectedId === row.id ? (
            <div className="fields">
              <label>
                Turn out of the picture, degrees
                <input
                  type="number"
                  step="any"
                  placeholder="optional"
                  onChange={(event) => {
                    const value = event.target.value
                    onChangeArea(row.id, value === '' ? null : Number(value))
                  }}
                />
              </label>
              <button type="button" className="linkish" onClick={() => onDelete(row.id)}>
                Delete
              </button>
            </div>
          ) : null}
        </article>
      ))}
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
      <label>
        Angle out of the plane, degrees
        <input
          type="number"
          step="any"
          placeholder="optional — blank leaves it uncorrected"
          value={ann.angleDeg ?? ''}
          onChange={(event) => onChange({ angleDeg: event.target.value === '' ? null : Number(event.target.value) })}
        />
      </label>
      <label>
        Doubt in that angle, degrees
        <input
          type="number"
          min="0"
          step="any"
          value={ann.angleUncertaintyDeg ?? ''}
          onChange={(event) =>
            onChange({ angleUncertaintyDeg: event.target.value === '' ? null : Number(event.target.value) })
          }
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
