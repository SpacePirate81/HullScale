import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type WheelEvent as ReactWheelEvent } from 'react'
import { distance, type Point } from '../math'
import { Loupe } from './Loupe'
import type { Annotation, FaceFacing, PlateDoc, Tool } from './types'
import { newId } from './types'

type View = { x: number; y: number; scale: number }
type LineDraft = { kind: 'reference' | 'measure' | 'horizon' | 'waterline'; a: Point; cursor: Point }
type CylinderDraft = { points: Point[]; cursor: Point | null }
type AreaDraft = { points: Point[]; cursor: Point | null; facing: FaceFacing }

const INK = '#7ec8c0'
const BRASS = '#c4a574'
const LOCK = '#ff4f00'

function fit(vw: number, vh: number, iw: number, ih: number): View {
  const scale = Math.min(vw / iw, vh / ih) * 0.96
  return { scale, x: (vw - iw * scale) / 2, y: (vh - ih * scale) / 2 }
}

export function PlateView({
  doc,
  tool,
  loupeOn,
  loupeZoom,
  facing,
  onCommit,
}: {
  doc: PlateDoc
  tool: Tool
  loupeOn: boolean
  loupeZoom: number
  facing: FaceFacing
  onCommit: (annotation: Annotation, openLock: boolean) => void
}) {
  const viewport = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const [view, setView] = useState<View>({ x: 0, y: 0, scale: 1 })
  const [ready, setReady] = useState(false)
  const [line, setLine] = useState<LineDraft | null>(null)
  const [cylinder, setCylinder] = useState<CylinderDraft | null>(null)
  const [area, setArea] = useState<AreaDraft | null>(null)
  const [hover, setHover] = useState<Point | null>(null)
  const [anchor, setAnchor] = useState<{ x: number; y: number } | null>(null)
  const [imageEl, setImageEl] = useState<HTMLImageElement | null>(null)
  const pan = useRef<{ x: number; y: number; view: View } | null>(null)
  const lineRef = useRef<LineDraft | null>(null)

  useEffect(() => {
    const node = viewport.current
    if (!node) return
    let done = false
    const observer = new ResizeObserver(() => {
      if (done || node.clientWidth < 32 || node.clientHeight < 32) return
      setView(fit(node.clientWidth, node.clientHeight, doc.width, doc.height))
      setReady(true)
      done = true
      observer.disconnect()
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [doc.id, doc.width, doc.height])

  useEffect(() => {
    lineRef.current = null
    setLine(null)
    setCylinder(null)
    setArea(null)
  }, [tool, doc.id])

  function toImage(event: { clientX: number; clientY: number }): Point {
    const rect = viewport.current?.getBoundingClientRect()
    if (!rect) return { x: 0, y: 0 }
    return {
      x: (event.clientX - rect.left - view.x) / view.scale,
      y: (event.clientY - rect.top - view.y) / view.scale,
    }
  }

  function commitLine(kind: LineDraft['kind'], a: Point, b: Point) {
    lineRef.current = null
    setLine(null)
    if (distance(a, b) < 2) return
    const id = newId()
    if (kind === 'horizon' || kind === 'waterline') {
      onCommit({ id, kind, a, b }, false)
    } else {
      onCommit(
        {
          id,
          kind: 'measure',
          role: kind,
          a,
          b,
          label: kind === 'reference' ? 'Reference' : 'Measure',
          referenceClicked: true,
          edgeA: 'clean',
          edgeB: 'clean',
          angleDeg: null,
          plane: null,
        },
        kind === 'reference',
      )
    }
  }

  function onPointerDown(event: ReactPointerEvent) {
    if (event.button !== 0) return
    const point = toImage(event)
    if (tool === 'pan') {
      pan.current = { x: event.clientX, y: event.clientY, view }
      viewport.current?.setPointerCapture(event.pointerId)
      return
    }
    if (tool === 'area') {
      const draft = area ?? { points: [], cursor: point, facing }
      const first = draft.points[0]
      if (first && draft.points.length >= 3 && distance(point, first) <= 14 / view.scale) {
        const structureId = doc.structures[doc.structures.length - 1]?.id ?? newId()
        onCommit(
          { id: newId(), kind: 'area', points: draft.points, facing: draft.facing, structureId, turnDeg: null },
          false,
        )
        setArea(null)
        return
      }
      setArea({ ...draft, points: [...draft.points, point], cursor: point })
      return
    }
    if (tool === 'cylinder') {
      const points = [...(cylinder?.points ?? []), point]
      if (points.length >= 4) {
        onCommit(
          {
            id: newId(),
            kind: 'cylinder',
            railA: [points[0], points[1]],
            railB: [points[2], points[3]],
            label: 'Cylinder',
          },
          true,
        )
        setCylinder(null)
        return
      }
      setCylinder({ points, cursor: point })
      return
    }
    const pending = lineRef.current
    if (pending && (tool === 'reference' || tool === 'measure' || tool === 'horizon' || tool === 'waterline')) {
      commitLine(pending.kind, pending.a, point)
      return
    }
    if (tool === 'reference' || tool === 'measure' || tool === 'horizon' || tool === 'waterline') {
      const next = { kind: tool, a: point, cursor: point }
      lineRef.current = next
      setLine(next)
      viewport.current?.setPointerCapture(event.pointerId)
    }
  }

  function onPointerMove(event: ReactPointerEvent) {
    const point = toImage(event)
    setHover(point)
    const rect = viewport.current?.getBoundingClientRect()
    if (rect) setAnchor({ x: event.clientX - rect.left, y: event.clientY - rect.top })
    if (pan.current) {
      setView({
        ...pan.current.view,
        x: pan.current.view.x + event.clientX - pan.current.x,
        y: pan.current.view.y + event.clientY - pan.current.y,
      })
      return
    }
    if (lineRef.current) {
      const next = { ...lineRef.current, cursor: point }
      lineRef.current = next
      setLine(next)
    }
    if (cylinder) setCylinder({ ...cylinder, cursor: point })
    if (area) setArea({ ...area, cursor: point })
  }

  function onPointerUp(event: ReactPointerEvent) {
    if (pan.current) {
      pan.current = null
      return
    }
    const pending = lineRef.current
    if (!pending) return
    const point = toImage(event)
    if (distance(pending.a, point) > 6) commitLine(pending.kind, pending.a, point)
  }

  function onWheel(event: ReactWheelEvent) {
    event.preventDefault()
    const rect = viewport.current?.getBoundingClientRect()
    if (!rect) return
    const nextScale = Math.min(12, Math.max(0.05, view.scale * (event.deltaY < 0 ? 1.12 : 1 / 1.12)))
    const px = event.clientX - rect.left
    const py = event.clientY - rect.top
    const imgX = (px - view.x) / view.scale
    const imgY = (py - view.y) / view.scale
    setView({ scale: nextScale, x: px - imgX * nextScale, y: py - imgY * nextScale })
  }

  return (
    <div className="stage-wrap">
      {doc.hint ? <p className="hint">{doc.hint}</p> : null}
      <div
        ref={viewport}
        className="stage"
        data-stage
        data-ready={ready ? 'true' : 'false'}
        data-tool={tool}
        data-view-x={view.x}
        data-view-y={view.y}
        data-view-scale={view.scale}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onWheel={onWheel}
      >
        <div className="plate-layer" style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})` }}>
          <img
            ref={(node) => {
              imageRef.current = node
              if (node) setImageEl(node)
            }}
            src={doc.src}
            alt={doc.name}
            width={doc.width}
            height={doc.height}
            draggable={false}
          />
          <svg viewBox={`0 0 ${doc.width} ${doc.height}`} width={doc.width} height={doc.height}>
            {doc.annotations.map((ann) => (
              <AnnotationShape key={ann.id} ann={ann} viewScale={view.scale} />
            ))}
            {line ? (
              <line x1={line.a.x} y1={line.a.y} x2={line.cursor.x} y2={line.cursor.y} stroke={LOCK} strokeWidth={1.6 / view.scale} />
            ) : null}
            {cylinder
              ? cylinder.points.map((point, index) => (
                  <circle key={index} cx={point.x} cy={point.y} r={4 / view.scale} fill={LOCK} />
                ))
              : null}
            {area && area.points.length > 0 ? (
              <polyline
                points={[...area.points, area.cursor].filter((point): point is Point => point != null).map((point) => `${point.x},${point.y}`).join(' ')}
                fill="none"
                stroke={LOCK}
                strokeWidth={1.4 / view.scale}
              />
            ) : null}
          </svg>
        </div>
        {loupeOn ? <Loupe image={imageEl} point={hover} zoom={loupeZoom} viewScale={view.scale} anchor={anchor} /> : null}
      </div>
    </div>
  )
}

function AnnotationShape({ ann, viewScale }: { ann: Annotation; viewScale: number }) {
  const width = 2.2 / viewScale
  if (ann.kind === 'measure') {
    const stroke = ann.knownMetres ? LOCK : INK
    return <line x1={ann.a.x} y1={ann.a.y} x2={ann.b.x} y2={ann.b.y} stroke={stroke} strokeWidth={ann.knownMetres ? width * 1.35 : width} />
  }
  if (ann.kind === 'horizon') {
    return (
      <line
        x1={ann.a.x}
        y1={ann.a.y}
        x2={ann.b.x}
        y2={ann.b.y}
        stroke={BRASS}
        strokeWidth={width}
        strokeDasharray={`${10 / viewScale} ${6 / viewScale}`}
      />
    )
  }
  if (ann.kind === 'waterline') {
    return <line x1={ann.a.x} y1={ann.a.y} x2={ann.b.x} y2={ann.b.y} stroke={BRASS} strokeWidth={width * 1.2} />
  }
  if (ann.kind === 'cylinder') {
    return (
      <g stroke={INK} fill="none" strokeWidth={width}>
        <line x1={ann.railA[0].x} y1={ann.railA[0].y} x2={ann.railA[1].x} y2={ann.railA[1].y} />
        <line x1={ann.railB[0].x} y1={ann.railB[0].y} x2={ann.railB[1].x} y2={ann.railB[1].y} />
      </g>
    )
  }
  const d = ann.points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ') + ' Z'
  return <path d={d} fill={INK} fillOpacity={0.16} stroke={INK} strokeWidth={width} />
}
