import { boundingBox, centroid, distance, lerp, midpoint, type Point } from './geometry'
import type { Horizon, ScaleRef } from './scale'
import { scaleAt } from './scale'

export type FaceFacing = 'front' | 'side' | 'top'

export type FaceInput = {
  facing: FaceFacing
  points: Point[]
}

export type PrismResult = {
  volumeM3: number | null
  note: string
}

/**
 * Rectangular box from the front, side, and top faces.
 * The same direction from two faces keeps the smaller value.
 */
export function prismVolume(faces: FaceInput[], refs: ScaleRef[], horizon: Horizon | null): PrismResult {
  if (refs.length === 0) {
    return { volumeM3: null, note: 'Lock a length before volume can be estimated.' }
  }
  const byFacing = new Map<FaceFacing, FaceInput>()
  for (const face of faces) {
    if (!byFacing.has(face.facing) && face.points.length >= 3) byFacing.set(face.facing, face)
  }
  const front = byFacing.get('front')
  const side = byFacing.get('side')
  const top = byFacing.get('top')
  if (!front && !side && !top) return { volumeM3: null, note: 'No closed faces.' }

  const scaledBox = (face: FaceInput) => {
    const local = scaleAt(centroid(face.points), refs, horizon)
    if (local == null) return null
    const box = boundingBox(face.points)
    return { w: box.w * local, h: box.h * local }
  }

  let width: number | null = null
  let height: number | null = null
  let depth: number | null = null

  if (front) {
    const box = scaledBox(front)
    if (box) {
      width = box.w
      height = box.h
    }
  }
  if (side) {
    const box = scaledBox(side)
    if (box) {
      depth = box.w
      height = height == null ? box.h : Math.min(height, box.h)
    }
  }
  if (top) {
    const box = scaledBox(top)
    if (box) {
      width = width == null ? box.w : Math.min(width, box.w)
      depth = depth == null ? box.h : Math.min(depth, box.h)
    }
  }

  const present = [width, height, depth].filter((value) => value != null && value > 0).length
  if (present < 2) {
    return { volumeM3: null, note: 'Need at least two orthogonal faces (front / side / top) for a prism bound.' }
  }
  if (width == null || height == null || depth == null) {
    return { volumeM3: null, note: 'Need the third axis (add a front, side, or top face) for a prism bound.' }
  }
  return {
    volumeM3: width * height * depth,
    note: 'Lower-bound prism: the rectangular box inscribed in the measured faces, not the true hull volume.',
  }
}

export type Rail = [Point, Point]

export type CylinderResult = {
  lengthM: number | null
  /** Null until a diameter is locked. The UI shows this when it is present. */
  volumeM3: number | null
}

function stations(railA: Rail, railB: Rail, n: number) {
  const out: { center: Point; diameterPx: number }[] = []
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const left = lerp(railA[0], railA[1], t)
    const right = lerp(railB[0], railB[1], t)
    out.push({ center: midpoint(left, right), diameterPx: distance(left, right) })
  }
  return out
}

/**
 * Two rails and an optional known diameter.
 * A changing pixel width is treated as perspective: the real diameter stays constant.
 * This is a cylinder. The cone formula is a separate function and is not called here.
 */
export function cylinderMeasure(
  railA: Rail,
  railB: Rail,
  knownDiameterM: number | null,
  refs: ScaleRef[],
  horizon: Horizon | null,
): CylinderResult {
  if (knownDiameterM != null && knownDiameterM > 0) {
    const samples = stations(railA, railB, 48)
    let length = 0
    for (let i = 1; i < samples.length; i++) {
      const step = distance(samples[i - 1].center, samples[i].center)
      const width = (samples[i - 1].diameterPx + samples[i].diameterPx) / 2
      if (width < 1e-6) continue
      length += (knownDiameterM / width) * step
    }
    return { lengthM: length, volumeM3: cylinderVolume(knownDiameterM, length) }
  }
  if (refs.length === 0) return { lengthM: null, volumeM3: null }
  const samples = stations(railA, railB, 24)
  let px = 0
  for (let i = 1; i < samples.length; i++) px += distance(samples[i - 1].center, samples[i].center)
  const mid = samples[Math.floor(samples.length / 2)]?.center ?? railA[0]
  const local = scaleAt(mid, refs, horizon)
  if (local == null) return { lengthM: null, volumeM3: null }
  return { lengthM: px * local, volumeM3: null }
}

export function cylinderVolume(diameterM: number, lengthM: number): number {
  const radius = diameterM / 2
  return Math.PI * radius * radius * lengthM
}

/** Only for a body the user has explicitly called a cone. */
export function coneVolume(diameterM: number, lengthM: number): number {
  return cylinderVolume(diameterM, lengthM) / 3
}

/** Both end radii are real diameters, not a perspective taper. */
export function frustumVolume(radiusA: number, radiusB: number, lengthM: number): number {
  return (1 / 3) * Math.PI * lengthM * (radiusA * radiusA + radiusA * radiusB + radiusB * radiusB)
}
