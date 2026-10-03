import {
  cylinderMeasure,
  DECISIONS,
  distance,
  errorBar,
  formatArea,
  formatLength,
  formatLengthPair,
  formatVolume,
  lengthOutOfPlane,
  metresPerPixel,
  midpoint,
  photoLength,
  pixelsPerMetre,
  prismVolume,
  projectedArea,
  scaleAt,
  scaleDisagreements,
  trueArea,
  type ClickClass,
  type Horizon,
  type LengthUnit,
  type Point,
  type ScaleRef,
} from '../math'
import type { Annotation, AreaAnn, CylinderAnn, MeasureAnn, PlateDoc } from './types'

export type MeasureRow = {
  id: string
  mark: string
  label: string
  px: number
  metres: number | null
  pair: string | null
  primary: string
  warning: string | null
  barText: string | null
  tone: 'ok' | 'amber' | 'red' | 'idle'
  notes: string[]
}

export type AreaRow = {
  id: string
  mark: string
  facing: string
  structureId: string
  primary: string
  metres2: number | null
  warning: string | null
}

export type VolumeRow = {
  id: string
  name: string
  text: string | null
  note: string
}

export type Report = {
  locked: boolean
  pxPerM: number | null
  flags: string[]
  horizon: boolean
  measures: MeasureRow[]
  areas: AreaRow[]
  cylinders: VolumeRow[]
  prisms: VolumeRow[]
}

function letter(index: number): string {
  let n = index
  let out = ''
  do {
    out = String.fromCharCode(65 + (n % 26)) + out
    n = Math.floor(n / 26) - 1
  } while (n >= 0)
  return out
}

function cylinderMiddle(ann: CylinderAnn): { at: Point; widthPx: number } {
  const t = 0.5
  const left = {
    x: ann.railA[0].x + (ann.railA[1].x - ann.railA[0].x) * t,
    y: ann.railA[0].y + (ann.railA[1].y - ann.railA[0].y) * t,
  }
  const right = {
    x: ann.railB[0].x + (ann.railB[1].x - ann.railB[0].x) * t,
    y: ann.railB[0].y + (ann.railB[1].y - ann.railB[0].y) * t,
  }
  return { at: midpoint(left, right), widthPx: distance(left, right) }
}

export function collectRefs(doc: PlateDoc): ScaleRef[] {
  const refs: ScaleRef[] = []
  for (const ann of doc.annotations) {
    if (ann.kind === 'measure' && ann.knownMetres != null && ann.knownMetres > 0) {
      const px = distance(ann.a, ann.b)
      const mpp = metresPerPixel(ann.knownMetres, px)
      if (mpp != null) refs.push({ id: ann.id, at: midpoint(ann.a, ann.b), metresPerPx: mpp })
    }
    if (ann.kind === 'cylinder' && ann.knownDiameterMetres != null && ann.knownDiameterMetres > 0) {
      const mid = cylinderMiddle(ann)
      const mpp = metresPerPixel(ann.knownDiameterMetres, mid.widthPx)
      if (mpp != null) refs.push({ id: ann.id, at: mid.at, metresPerPx: mpp })
    }
  }
  return refs
}

function horizonOf(doc: PlateDoc): Horizon | null {
  if (DECISIONS.horizonAffectsScale) {
    const horizon = doc.annotations.find((ann) => ann.kind === 'horizon')
    if (horizon && horizon.kind === 'horizon') return { a: horizon.a, b: horizon.b }
  }
  if (DECISIONS.waterlineAffectsScale) {
    const waterline = doc.annotations.find((ann) => ann.kind === 'waterline')
    if (waterline && waterline.kind === 'waterline') return { a: waterline.a, b: waterline.b }
  }
  return null
}

function marks(annotations: Annotation[]): Map<string, string> {
  const map = new Map<string, string>()
  let n = 0
  for (const ann of annotations) {
    if (ann.kind === 'measure' || ann.kind === 'cylinder' || (ann.kind === 'area' && ann.points.length >= 3)) {
      map.set(ann.id, letter(n))
      n += 1
    }
  }
  return map
}

export function buildReport(doc: PlateDoc, unit: LengthUnit): Report {
  const refs = collectRefs(doc)
  const horizon = horizonOf(doc)
  const locked = refs.length > 0
  const flat = refs.length === 0 ? null : scaleAt({ x: 0, y: 0 }, refs, null)
  const names = marks(doc.annotations)
  const refMeasure = doc.annotations.find(
    (ann): ann is MeasureAnn => ann.kind === 'measure' && (ann.knownMetres ?? 0) > 0,
  )

  const measures: MeasureRow[] = []
  const cylinders: VolumeRow[] = []
  for (const ann of doc.annotations) {
    if (ann.kind === 'measure') {
      measures.push(measureRow(ann, doc.clickClass, refs, horizon, refMeasure, names.get(ann.id) ?? '?', unit))
    }
    if (ann.kind === 'cylinder') {
      const body = cylinderMeasure(ann.railA, ann.railB, ann.knownDiameterMetres ?? null, refs, horizon)
      const mark = names.get(ann.id) ?? '?'
      const lengthText = body.lengthM == null ? 'pixels until a diameter or a length is locked' : formatLengthPair(body.lengthM, unit)
      const volumeText =
        DECISIONS.showCylinderVolume && body.volumeM3 != null ? formatVolume(body.volumeM3, unit) : null
      cylinders.push({
        id: ann.id,
        name: `${mark}  ${ann.label?.trim() || 'Cylinder'}`,
        text: volumeText == null ? lengthText : `${lengthText}   ·   volume ${volumeText}`,
        note: ann.knownDiameterMetres
          ? 'Cylinder of the locked diameter. A taper on the photo is perspective, not a cone.'
          : 'Lock a diameter to read length and cylinder volume.',
      })
    }
  }

  const areas: AreaRow[] = []
  for (const ann of doc.annotations) {
    if (ann.kind !== 'area' || ann.points.length < 3) continue
    areas.push(areaRow(ann, refs, horizon, names.get(ann.id) ?? '?', unit))
  }

  const prisms: VolumeRow[] = doc.structures.map((structure) => {
    const faces = doc.annotations.filter(
      (ann): ann is AreaAnn => ann.kind === 'area' && ann.structureId === structure.id && ann.points.length >= 3,
    )
    const prism = prismVolume(
      faces.map((face) => ({ facing: face.facing, points: face.points })),
      refs,
      horizon,
    )
    return {
      id: structure.id,
      name: structure.name,
      text: prism.volumeM3 == null ? null : `${formatVolume(prism.volumeM3, unit)} lower bound`,
      note: prism.note,
    }
  })

  return {
    locked,
    pxPerM: flat == null ? null : pixelsPerMetre(flat),
    flags: scaleDisagreements(refs),
    horizon: horizon != null,
    measures,
    areas,
    cylinders,
    prisms,
  }
}

function measureRow(
  ann: MeasureAnn,
  clickClass: ClickClass,
  refs: ScaleRef[],
  horizon: Horizon | null,
  refMeasure: MeasureAnn | undefined,
  mark: string,
  unit: LengthUnit,
): MeasureRow {
  const px = distance(ann.a, ann.b)
  const photo = photoLength(ann.a, ann.b, refs, horizon)
  const angled = photo == null ? null : lengthOutOfPlane(photo, ann.angleDeg)
  const metres = angled?.metres ?? null
  const isRef = refMeasure?.id === ann.id
  const bar =
    metres == null
      ? null
      : errorBar({
          metres,
          lengthPx: px,
          clickClass,
          edgeA: ann.edgeA,
          edgeB: ann.edgeB,
          refPx: !isRef && refMeasure ? distance(refMeasure.a, refMeasure.b) : null,
          refEdgeA: refMeasure?.edgeA,
          refEdgeB: refMeasure?.edgeB,
          referenceClicked: !isRef && refMeasure != null && refMeasure.referenceClicked !== false,
          knownMetres: refMeasure?.knownMetres ?? ann.knownMetres ?? null,
          toleranceMetres: refMeasure?.knownTolMetres ?? ann.knownTolMetres ?? 0,
          angleDeg: ann.angleDeg,
          angleUncertaintyDeg: ann.angleUncertaintyDeg,
          plane: ann.plane ?? null,
        })
  const label = ann.label?.trim() || (ann.role === 'reference' ? 'Reference' : 'Measure')
  return {
    id: ann.id,
    mark,
    label,
    px,
    metres,
    pair: metres == null ? null : formatLengthPair(metres, unit),
    primary: metres == null ? `${Math.round(px)} px` : formatLength(metres, unit),
    warning: angled?.warning ?? null,
    barText:
      bar?.sigmaM == null
        ? null
        : `± ${formatLength(bar.sigmaM, unit)} (±${(bar.rel * 100).toFixed(1)}%)`,
    tone: bar?.tone ?? 'idle',
    notes: bar?.warnings.map((item) => item.text) ?? [],
  }
}

function areaRow(ann: AreaAnn, refs: ScaleRef[], horizon: Horizon | null, mark: string, unit: LengthUnit): AreaRow {
  const projected = projectedArea(ann.points, refs, horizon)
  const turned = projected == null ? null : trueArea(projected, ann.turnDeg)
  return {
    id: ann.id,
    mark,
    facing: ann.facing,
    structureId: ann.structureId,
    metres2: turned?.metres2 ?? null,
    primary: turned == null ? `${Math.round(ann.points.length)} pts` : formatArea(turned.metres2, unit),
    warning: turned?.warning ?? (projected == null ? 'Lock a length before area is in metres.' : null),
  }
}

export function reportText(doc: PlateDoc, unit: LengthUnit): string {
  const report = buildReport(doc, unit)
  const lines = [
    `Hullscale report — ${doc.name}`,
    'Measured from a photo — not a manufacturer figure',
    report.locked ? 'Scale locked' : 'No length locked (pixels only)',
    report.horizon ? 'Horizon is steering the scale' : 'No horizon — scale is flat across the plate',
    '',
  ]
  for (const row of report.measures) {
    lines.push(`${row.mark}  ${row.label}  ${row.pair ?? row.primary}${row.barText ? `  ${row.barText}` : ''}`)
  }
  for (const row of report.cylinders) lines.push(`${row.name}  ${row.text ?? ''}`, `  ${row.note}`)
  for (const row of report.areas) lines.push(`${row.mark}  ${row.facing}  projected ${row.primary}`)
  for (const row of report.prisms) {
    lines.push('', row.name, row.text ? `  prism ${row.text}` : '  no prism yet', `  ${row.note}`)
  }
  return lines.join('\n')
}
