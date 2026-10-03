import { useEffect, useState } from 'react'
import { LENGTH_UNITS, type ClickClass, type LengthUnit, type LibraryEntry } from '../math'
import { Home } from './Home'
import { LockDialog } from './LockDialog'
import { PlateView } from './PlateView'
import { Readout } from './Readout'
import { reportText } from './report'
import { SAMPLES, type SamplePlate } from './samples'
import { Toolbar, TOOL_KEYS } from './Toolbar'
import type { Annotation, FaceFacing, PlateDoc, Tool } from './types'
import { newId } from './types'
import { publicUrl } from './publicUrl'
import { APP_VERSION } from './version'

export function App() {
  const [docs, setDocs] = useState<PlateDoc[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [tool, setTool] = useState<Tool>('reference')
  const [unit, setUnit] = useState<LengthUnit>('m')
  const [loupeOn, setLoupeOn] = useState(true)
  const [loupeZoom, setLoupeZoom] = useState<2 | 3 | 4>(3)
  const [clickClass, setClickClass] = useState<ClickClass>('finger')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [lockId, setLockId] = useState<string | null>(null)
  const [custom, setCustom] = useState<LibraryEntry[]>([])
  const [facing, setFacing] = useState<FaceFacing>('side')
  const active = docs.find((doc) => doc.id === activeId) ?? null

  function patchDoc(id: string, fn: (doc: PlateDoc) => PlateDoc) {
    setDocs((current) => current.map((doc) => (doc.id === id ? fn(doc) : doc)))
  }

  function openDoc(doc: PlateDoc) {
    setDocs((current) => [...current.filter((item) => item.id !== doc.id), doc])
    setActiveId(doc.id)
    setTool('reference')
    setSelectedId(null)
    setLockId(null)
  }

  function openSample(sample: SamplePlate) {
    openDoc({
      id: sample.id,
      name: sample.name,
      src: sample.src,
      width: sample.width,
      height: sample.height,
      hint: sample.hint,
      annotations: [],
      structures: [{ id: newId(), name: 'Structure 1' }],
      clickClass,
    })
  }

  function openFile(file: File) {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      openDoc({
        id: newId(),
        name: file.name,
        src: url,
        width: image.naturalWidth,
        height: image.naturalHeight,
        hint: 'Draw a reference across something of known size, then lock it.',
        annotations: [],
        structures: [{ id: newId(), name: 'Structure 1' }],
        clickClass,
      })
    }
    image.src = url
  }

  function commit(annotation: Annotation, openLock: boolean) {
    if (!active) return
    patchDoc(active.id, (doc) => {
      let annotations = doc.annotations
      if (annotation.kind === 'horizon' || annotation.kind === 'waterline') {
        annotations = annotations.filter((item) => item.kind !== annotation.kind)
      }
      let structures = doc.structures
      if (annotation.kind === 'area' && !structures.some((item) => item.id === annotation.structureId)) {
        structures = [...structures, { id: annotation.structureId, name: `Structure ${structures.length + 1}` }]
      }
      return { ...doc, annotations: [...annotations, annotation], structures }
    })
    setSelectedId(annotation.id)
    if (openLock) setLockId(annotation.id)
  }

  function assignLock(entry: LibraryEntry, tolerance: number) {
    if (!active || !lockId) return
    patchDoc(active.id, (doc) => ({
      ...doc,
      annotations: doc.annotations.map((ann) => {
        if (ann.id !== lockId) return ann
        if (ann.kind === 'cylinder') {
          return { ...ann, knownDiameterMetres: entry.metres, libraryId: entry.id, label: entry.name }
        }
        if (ann.kind === 'measure') {
          return {
            ...ann,
            knownMetres: entry.metres,
            knownTolMetres: tolerance,
            libraryId: entry.id,
            label: entry.name,
            referenceClicked: true,
          }
        }
        return ann
      }),
    }))
    setLockId(null)
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) return
      const next = TOOL_KEYS[event.key.toUpperCase()]
      if (next) setTool(next)
      if (event.key === 'Escape') setLockId(null)
      if ((event.key === 'Delete' || event.key === 'Backspace') && active && selectedId) {
        patchDoc(active.id, (doc) => ({ ...doc, annotations: doc.annotations.filter((ann) => ann.id !== selectedId) }))
        setSelectedId(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active, selectedId])

  const lockAnn = active?.annotations.find((ann) => ann.id === lockId)

  return (
    <div className="app">
      <header className="topbar">
        <button type="button" className="brand" onClick={() => setActiveId(null)}>
          <img src={publicUrl('favicon.svg')} alt="" />
          <span className="wordmark">HULLSCALE</span>
        </button>
        <span className="version">v{APP_VERSION}</span>
        <span className="spacer" />
        <div className="cluster">
          <div className="units" role="radiogroup" aria-label="Length unit">
            {LENGTH_UNITS.map((item) => (
              <button key={item} type="button" role="radio" aria-checked={unit === item} onClick={() => setUnit(item)}>
                {item}
              </button>
            ))}
          </div>
          <button type="button" className="ghost" aria-pressed={loupeOn} onClick={() => setLoupeOn((on) => !on)}>
            Loupe
          </button>
          {loupeOn ? (
            <button
              type="button"
              className="zoom"
              onClick={() => setLoupeZoom((zoom) => (zoom === 2 ? 3 : zoom === 3 ? 4 : 2))}
            >
              {loupeZoom}×
            </button>
          ) : null}
          <select
            aria-label="Click doubt"
            value={clickClass}
            onChange={(event) => {
              const value = event.target.value as ClickClass
              setClickClass(value)
              if (active) patchDoc(active.id, (doc) => ({ ...doc, clickClass: value }))
            }}
          >
            <option value="finger">Finger</option>
            <option value="stylus">Stylus</option>
            <option value="loupe">Loupe click</option>
          </select>
          {active && tool === 'area' ? (
            <select aria-label="Face" value={facing} onChange={(event) => setFacing(event.target.value as FaceFacing)}>
              <option value="front">Front</option>
              <option value="side">Side</option>
              <option value="top">Top</option>
            </select>
          ) : null}
          {SAMPLES.length > 0 && active ? (
            <button type="button" className="ghost" onClick={() => setActiveId(null)}>
              Plates
            </button>
          ) : null}
        </div>
      </header>
      {active ? (
        <div className="workspace">
          <Toolbar tool={tool} onTool={setTool} />
          <PlateView
            key={active.id}
            doc={active}
            tool={tool}
            loupeOn={loupeOn}
            loupeZoom={loupeZoom}
            facing={facing}
            onCommit={commit}
          />
          <Readout
            doc={active}
            unit={unit}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onChangeMeasure={(id, patch) =>
              patchDoc(active.id, (doc) => ({
                ...doc,
                annotations: doc.annotations.map((ann) => (ann.id === id && ann.kind === 'measure' ? { ...ann, ...patch } : ann)),
              }))
            }
            onChangeArea={(id, turnDeg) =>
              patchDoc(active.id, (doc) => ({
                ...doc,
                annotations: doc.annotations.map((ann) => (ann.id === id && ann.kind === 'area' ? { ...ann, turnDeg } : ann)),
              }))
            }
            onLock={setLockId}
            onDelete={(id) => {
              patchDoc(active.id, (doc) => ({ ...doc, annotations: doc.annotations.filter((ann) => ann.id !== id) }))
              setSelectedId(null)
            }}
            onCopy={() => {
              void navigator.clipboard?.writeText(reportText(active, unit))
            }}
          />
        </div>
      ) : (
        <Home onSample={openSample} onFile={openFile} />
      )}
      {lockAnn ? (
        <LockDialog
          title={lockAnn.kind === 'cylinder' ? 'Lock a diameter' : 'Lock a known length'}
          custom={custom}
          onCustom={(entry) => setCustom((current) => [...current, entry])}
          onPick={assignLock}
          onClose={() => setLockId(null)}
        />
      ) : null}
    </div>
  )
}
