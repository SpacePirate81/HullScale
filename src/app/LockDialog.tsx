import { useMemo, useState } from 'react'
import { libraryGroups, REFERENCE_LIBRARY, type LibraryEntry } from '../math'

export function LockDialog({
  title,
  custom,
  onCustom,
  onPick,
  onClose,
}: {
  title: string
  custom: LibraryEntry[]
  onCustom: (entry: LibraryEntry) => void
  onPick: (entry: LibraryEntry, tolerance: number) => void
  onClose: () => void
}) {
  const [query, setQuery] = useState('')
  const [metres, setMetres] = useState('')
  const [name, setName] = useState('')
  const [tolerance, setTolerance] = useState('')
  const tol = Number(tolerance)
  const entries = useMemo(() => {
    const all = [...REFERENCE_LIBRARY, ...custom]
    const q = query.trim().toLowerCase()
    if (!q) return all
    return all.filter((entry) => `${entry.name} ${entry.group}`.toLowerCase().includes(q))
  }, [custom, query])

  return (
    <div className="dialog-back" onMouseDown={onClose}>
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="lock-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h2 id="lock-title">{title}</h2>
        <p className="muted">Pick a library length, or type one. Leave tolerance blank if you do not know it.</p>
        <input
          type="search"
          placeholder="Search the library"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          autoFocus
        />
        <label className="muted">
          Tolerance, metres (optional)
          <input type="number" min="0" step="any" value={tolerance} onChange={(event) => setTolerance(event.target.value)} />
        </label>
        {libraryGroups()
          .concat(custom.length ? ['Custom'] : [])
          .map((group) => {
            const rows = entries.filter((entry) => entry.group === group)
            if (rows.length === 0) return null
            return (
              <div key={group} className="lib-group">
                <p>{group.toUpperCase()}</p>
                {rows.map((entry) => (
                  <button key={entry.id} type="button" onClick={() => onPick(entry, Number.isFinite(tol) ? tol : 0)}>
                    <span>{entry.name}</span>
                    <span>{entry.metres} m</span>
                  </button>
                ))}
              </div>
            )
          })}
        <div className="lib-group">
          <p>TYPE A LENGTH</p>
          <input placeholder="Name" value={name} onChange={(event) => setName(event.target.value)} />
          <div className="custom-row">
            <input
              type="number"
              min="0"
              step="any"
              placeholder="Metres"
              value={metres}
              onChange={(event) => setMetres(event.target.value)}
            />
            <button
              type="button"
              onClick={() => {
                const value = Number(metres)
                if (!(value > 0)) return
                const entry: LibraryEntry = {
                  id: `custom-${crypto.randomUUID()}`,
                  name: name.trim() || 'Custom length',
                  metres: value,
                  kind: 'length',
                  group: 'Custom',
                }
                onCustom(entry)
                onPick(entry, Number.isFinite(tol) ? tol : 0)
              }}
            >
              Use
            </button>
          </div>
        </div>
        <p>
          <button type="button" className="linkish" onClick={onClose}>
            Cancel
          </button>
        </p>
      </div>
    </div>
  )
}
