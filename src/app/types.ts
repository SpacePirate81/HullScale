import type { ClickClass, EdgeKind, FaceFacing, PlaneTag, Point } from '../math'

export type { FaceFacing }

export type Tool = 'pan' | 'reference' | 'measure' | 'cylinder' | 'area' | 'horizon' | 'waterline'

export type MeasureAnn = {
  id: string
  kind: 'measure'
  role: 'reference' | 'measure'
  a: Point
  b: Point
  label?: string
  libraryId?: string
  knownMetres?: number
  knownTolMetres?: number
  referenceClicked?: boolean
  edgeA?: EdgeKind
  edgeB?: EdgeKind
  /** Degrees out of the scale plane. Unset leaves the length uncorrected. */
  angleDeg?: number | null
  angleUncertaintyDeg?: number | null
  plane?: PlaneTag
}

export type CylinderAnn = {
  id: string
  kind: 'cylinder'
  railA: [Point, Point]
  railB: [Point, Point]
  label?: string
  libraryId?: string
  knownDiameterMetres?: number
}

export type AreaAnn = {
  id: string
  kind: 'area'
  points: Point[]
  facing: FaceFacing
  structureId: string
  turnDeg?: number | null
}

export type HorizonAnn = {
  id: string
  kind: 'horizon'
  a: Point
  b: Point
}

export type WaterlineAnn = {
  id: string
  kind: 'waterline'
  a: Point
  b: Point
}

export type Annotation = MeasureAnn | CylinderAnn | AreaAnn | HorizonAnn | WaterlineAnn

export type Structure = { id: string; name: string }

export type PlateDoc = {
  id: string
  name: string
  src: string
  width: number
  height: number
  hint?: string
  annotations: Annotation[]
  structures: Structure[]
  clickClass: ClickClass
}

export function newId(): string {
  return crypto.randomUUID()
}
