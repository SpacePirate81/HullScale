import { boundingBox, centroid, distance, finitePoint, lerp, midpoint, type Point } from './geometry'
import type { Horizon, ScaleRef } from './scale'
import { scaleAt } from './scale'

export type FaceFacing = 'front' | 'side' | 'top'

/** Which way the ship's length runs on a top-view outline. */
export type TopLengthAxis = 'x' | 'y'

export type FaceInput = {
  facing: FaceFacing
  points: Point[]
  /**
   * Top view only.
   * 'x' means length runs left-right. 'y' means length runs up-down.
   * Omit it and the top view is matched to the front and side faces.
   */
  lengthAxis?: TopLengthAxis | null
}

export type PrismResult = {
  volumeM3: number | null
  note: string
}

const UPPER_BOUND =
  'Upper-bound box: the rectangular box around the measured faces. The object fits inside it when those outlines are the full silhouette, so this is not the true volume.'

type AxisPair = { across: number; along: number }

function positive(value: number | null): value is number {
  return value != null && Number.isFinite(value) && value > 0
}

function relGap(a: number, b: number): number {
  return Math.abs(a - b) / Math.max(Math.abs(a), Math.abs(b), 1e-9)
}

/**
 * Image x is left-right, image y is up-down.
 * `across` is beam (the front-view width). `along` is length (the side-view depth).
 */
function orientTop(
  box: { w: number; h: number },
  width: number | null,
  depth: number | null,
  lengthAxis: TopLengthAxis | null | undefined,
): { across: number; along: number; sentence: string } {
  const lengthUpDown: AxisPair = { across: box.w, along: box.h }
  const lengthLeftRight: AxisPair = { across: box.h, along: box.w }
  const haveCue = positive(width) || positive(depth)
  const cost = (option: AxisPair) => {
    let total = 0
    if (positive(width)) total += relGap(option.across, width)
    if (positive(depth)) total += relGap(option.along, depth)
    return total
  }
  const fights = (chosen: AxisPair, other: AxisPair) => haveCue && cost(chosen) > cost(other) + 0.15 && cost(chosen) > 0.2

  if (lengthAxis === 'x') {
    return {
      ...lengthLeftRight,
      sentence: fights(lengthLeftRight, lengthUpDown)
        ? 'The top view is tagged length left-right, and that does not match the other faces.'
        : 'Top view length runs left-right, as tagged.',
    }
  }
  if (lengthAxis === 'y') {
    return {
      ...lengthUpDown,
      sentence: fights(lengthUpDown, lengthLeftRight)
        ? 'The top view is tagged length up-down, and that does not match the other faces.'
        : 'Top view length runs up-down, as tagged.',
    }
  }
  if (!haveCue) {
    return { ...lengthUpDown, sentence: 'Top view assumes length runs up-down until you tag it.' }
  }
  const costUpDown = cost(lengthUpDown)
  const costLeftRight = cost(lengthLeftRight)
  const pickLeftRight = costLeftRight < costUpDown
  const picked = pickLeftRight ? lengthLeftRight : lengthUpDown
  const best = Math.min(costUpDown, costLeftRight)
  const gap = Math.abs(costUpDown - costLeftRight)
  const axesDiffer = relGap(lengthUpDown.across, lengthLeftRight.across) > 0.05 || relGap(lengthUpDown.along, lengthLeftRight.along) > 0.05
  if (best > 0.05 && gap < 0.12 && axesDiffer) {
    return {
      ...picked,
      sentence: 'The top view could run either way. Tag whether length runs left-right or up-down.',
    }
  }
  const way = pickLeftRight ? 'left-right' : 'up-down'
  return { ...picked, sentence: `Top view length was matched to the other faces and runs ${way}.` }
}

/**
 * Rectangular box from the front, side, and top faces.
 * The same direction from two faces keeps the smaller value.
 * That box contains the outlines, so the volume is an upper bound, not an inscribed lower bound.
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
    if (face.points.some((point) => !finitePoint(point))) return null
    const local = scaleAt(centroid(face.points), refs, horizon)
    if (local == null || !(local > 0)) return null
    const box = boundingBox(face.points)
    if (!Number.isFinite(box.w) || !Number.isFinite(box.h)) return null
    return { w: box.w * local, h: box.h * local }
  }

  let width: number | null = null
  let height: number | null = null
  let depth: number | null = null
  let rejected = 0
  let topSentence: string | null = null

  if (front) {
    const box = scaledBox(front)
    if (!box) rejected += 1
    else {
      width = box.w
      height = box.h
    }
  }
  if (side) {
    const box = scaledBox(side)
    if (!box) rejected += 1
    else {
      depth = box.w
      height = height == null ? box.h : Math.min(height, box.h)
    }
  }
  if (top) {
    const box = scaledBox(top)
    if (!box) rejected += 1
    else {
      const oriented = orientTop(box, width, depth, top.lengthAxis)
      topSentence = oriented.sentence
      width = width == null ? oriented.across : Math.min(width, oriented.across)
      depth = depth == null ? oriented.along : Math.min(depth, oriented.along)
    }
  }

  const present = [width, height, depth].filter((value) => positive(value)).length
  const withTop = (note: string) => (topSentence ? `${note} ${topSentence}` : note)
  if (present < 2) {
    const note = rejected > 0 ? 'A face has coordinates or a scale that cannot be used.' : 'Need at least two orthogonal faces (front / side / top) for a prism bound.'
    return { volumeM3: null, note: withTop(note) }
  }
  if (!positive(width) || !positive(height) || !positive(depth)) {
    const note = rejected > 0 ? 'A face has coordinates or a scale that cannot be used.' : 'Need the third axis (add a front, side, or top face) for a prism bound.'
    return { volumeM3: null, note: withTop(note) }
  }
  return {
    volumeM3: width * height * depth,
    note: withTop(UPPER_BOUND),
  }
}

export type Rail = [Point, Point]

export type CylinderResult = {
  lengthM: number | null
  /** Null until a diameter is locked. The UI shows this when it is present. */
  volumeM3: number | null
  warning: string | null
}

const NO_CYLINDER: CylinderResult = { lengthM: null, volumeM3: null, warning: null }

/**
 * Pair the second rail with the first by its nearer ends.
 * Four clicks often run the second rail back toward the start. Leaving that order
 * crosses the stations and the centre line collapses to a point.
 */
export function alignRail(railA: Rail, railB: Rail): Rail {
  const direct = distance(railA[0], railB[0]) + distance(railA[1], railB[1])
  const flipped = distance(railA[0], railB[1]) + distance(railA[1], railB[0])
  if (Number.isFinite(flipped) && Number.isFinite(direct) && flipped < direct) return [railB[1], railB[0]]
  return railB
}

function stations(railA: Rail, railB: Rail, n: number) {
  const aligned = alignRail(railA, railB)
  const out: { center: Point; diameterPx: number }[] = []
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const left = lerp(railA[0], railA[1], t)
    const right = lerp(aligned[0], aligned[1], t)
    out.push({ center: midpoint(left, right), diameterPx: distance(left, right) })
  }
  return out
}

function railsAreReal(railA: Rail, railB: Rail): boolean {
  return [...railA, ...railB].every(finitePoint)
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
  if (!railsAreReal(railA, railB)) {
    return { ...NO_CYLINDER, warning: 'The rails have coordinates that are not real numbers.' }
  }
  if (knownDiameterM != null && !Number.isFinite(knownDiameterM)) {
    return { ...NO_CYLINDER, warning: 'The diameter is not a real number.' }
  }
  if (knownDiameterM != null && knownDiameterM > 0) {
    const samples = stations(railA, railB, 48)
    let length = 0
    for (let i = 1; i < samples.length; i++) {
      const step = distance(samples[i - 1].center, samples[i].center)
      const width = (samples[i - 1].diameterPx + samples[i].diameterPx) / 2
      if (!(width > 1e-6) || !Number.isFinite(step)) continue
      length += (knownDiameterM / width) * step
    }
    if (!Number.isFinite(length)) return { ...NO_CYLINDER, warning: 'The cylinder length is not a real number.' }
    return {
      lengthM: length,
      volumeM3: cylinderVolume(knownDiameterM, length),
      warning: length === 0 ? 'The rails have no length along the body.' : null,
    }
  }
  if (refs.length === 0) return NO_CYLINDER
  const samples = stations(railA, railB, 24)
  let px = 0
  for (let i = 1; i < samples.length; i++) px += distance(samples[i - 1].center, samples[i].center)
  const mid = samples[Math.floor(samples.length / 2)]?.center ?? railA[0]
  const local = scaleAt(mid, refs, horizon)
  if (local == null) return NO_CYLINDER
  const length = px * local
  if (!Number.isFinite(length)) return { ...NO_CYLINDER, warning: 'The cylinder length is not a real number.' }
  return {
    lengthM: length,
    volumeM3: null,
    warning: length === 0 ? 'The rails have no length along the body.' : null,
  }
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
