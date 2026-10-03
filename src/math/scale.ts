import { DECISIONS } from './decisions'
import { distance, finitePoint, lerp, midpoint, signedLineDistance, type Point } from './geometry'

export type ScaleRef = {
  id?: string
  at: Point
  metresPerPx: number
}

export type Horizon = { a: Point; b: Point }

/** Two locks farther apart than this (as a fraction) raise a warning. */
export const SCALE_DISAGREE = 0.08

const MIN_LINE_PX = 1e-6
/** A horizon shorter than this is not a line, so the scale stays flat. */
const MIN_HORIZON_PX = 1
/** This close to the horizon line counts as sitting on it. */
const ON_HORIZON_PX = 1e-3

export function metresPerPixel(knownMetres: number, pixelLength: number): number | null {
  if (!Number.isFinite(knownMetres) || !Number.isFinite(pixelLength)) return null
  if (!(knownMetres > 0) || !(pixelLength > MIN_LINE_PX)) return null
  return knownMetres / pixelLength
}

/** Null when the scale is zero, negative, or not a real number. */
export function pixelsPerMetre(metresPerPx: number): number | null {
  if (!Number.isFinite(metresPerPx) || !(metresPerPx > 0)) return null
  return 1 / metresPerPx
}

function usableRef(ref: ScaleRef): boolean {
  return finitePoint(ref.at) && Number.isFinite(ref.metresPerPx) && ref.metresPerPx > 0
}

function usableRefs(refs: ScaleRef[]): ScaleRef[] {
  return refs.filter(usableRef)
}

export function averageMetresPerPx(refs: ScaleRef[]): number | null {
  const usable = usableRefs(refs)
  if (usable.length === 0) return null
  return usable.reduce((sum, ref) => sum + ref.metresPerPx, 0) / usable.length
}

function horizonReady(horizon: Horizon | null): horizon is Horizon {
  return horizon != null && DECISIONS.horizonAffectsScale && distance(horizon.a, horizon.b) >= MIN_HORIZON_PX
}

/**
 * Positive on the image-down side of the horizon.
 * In an upright photo that side is the sea. Drawing the horizon from either end does not flip it.
 * Null when the horizon is too short to define a side.
 */
export function horizonGroundDistance(point: Point, horizon: Horizon): number | null {
  if (distance(horizon.a, horizon.b) < MIN_HORIZON_PX) return null
  const raw = signedLineDistance(point, horizon.a, horizon.b)
  const down = signedLineDistance({ x: horizon.a.x, y: horizon.a.y + 1 }, horizon.a, horizon.b)
  if (down !== 0) return down > 0 ? raw : -raw
  const right = signedLineDistance({ x: horizon.a.x + 1, y: horizon.a.y }, horizon.a, horizon.b)
  if (right === 0) return raw
  return right > 0 ? raw : -raw
}

type Span = { along: number; groundA: number; groundB: number }

function spanAgainstHorizon(a: Point, b: Point, horizon: Horizon): Span | null {
  if (!horizonReady(horizon)) return null
  const len = distance(horizon.a, horizon.b)
  const hx = (horizon.b.x - horizon.a.x) / len
  const hy = (horizon.b.y - horizon.a.y) / len
  const groundA = horizonGroundDistance(a, horizon)
  const groundB = horizonGroundDistance(b, horizon)
  if (groundA == null || groundB == null) return null
  return {
    along: (b.x - a.x) * hx + (b.y - a.y) * hy,
    groundA,
    groundB,
  }
}

/**
 * Lower end of a mast-like line, or null when the line lies along the sea.
 * A mast is steeper than 45° to the horizon. Every point on it shares the base's depth,
 * so the sea-level formula must not be sampled up the mast.
 */
function mastBase(a: Point, b: Point, horizon: Horizon | null): Point | null {
  if (!horizon) return null
  const span = spanAgainstHorizon(a, b, horizon)
  if (!span) return null
  if (!(Math.abs(span.groundB - span.groundA) > Math.abs(span.along))) return null
  return span.groundA >= span.groundB ? a : b
}

/**
 * Where a locked length's scale belongs.
 * A level lock sits at its midpoint. A vertical lock sits at its lower end,
 * because that end is the distance from the camera the whole mast shares.
 */
export function referenceAnchor(a: Point, b: Point, horizon: Horizon | null): Point {
  return mastBase(a, b, horizon) ?? midpoint(a, b)
}

/**
 * Metres per pixel at a point.
 * With no horizon, this is the plain average of the locks.
 * With a horizon, closer to the camera (farther image-down from the horizon) means
 * fewer metres per pixel. Points on or above the horizon are not on the sea, so they have no scale.
 * A waterline is never passed in. See DECISIONS.waterlineAffectsScale.
 */
export function scaleAt(point: Point, refs: ScaleRef[], horizon: Horizon | null): number | null {
  const usable = usableRefs(refs)
  if (usable.length === 0) return null
  if (!horizonReady(horizon)) return averageMetresPerPx(usable)
  const here = horizonGroundDistance(point, horizon)
  if (here == null || !(here > ON_HORIZON_PX)) return null
  let sum = 0
  let n = 0
  for (const ref of usable) {
    const there = horizonGroundDistance(ref.at, horizon)
    if (there == null || !(there > ON_HORIZON_PX)) continue
    sum += ref.metresPerPx * (there / here)
    n += 1
  }
  return n === 0 ? null : sum / n
}

/**
 * Straight length in metres.
 * A mast uses one scale, taken at its lower end. A line along the sea is sampled in equal steps
 * (eight by default, matching v0.9.4). A line on the sea that runs toward the horizon is still
 * only that sideways sampling: it is not the distance walked toward the camera.
 */
export function integrateLength(
  a: Point,
  b: Point,
  refs: ScaleRef[],
  horizon: Horizon | null,
  steps = 8,
): number | null {
  if (usableRefs(refs).length === 0) return null
  if (!finitePoint(a) || !finitePoint(b)) return null
  const base = mastBase(a, b, horizon)
  if (base) {
    const local = scaleAt(base, refs, horizon)
    if (local == null) return null
    const px = distance(a, b)
    if (!Number.isFinite(px)) return null
    return px * local
  }
  let metres = 0
  for (let i = 1; i <= steps; i++) {
    const start = lerp(a, b, (i - 1) / steps)
    const end = lerp(a, b, i / steps)
    const local = scaleAt(midpoint(start, end), refs, horizon)
    if (local == null) return null
    const step = distance(start, end) * local
    if (!Number.isFinite(step)) return null
    metres += step
  }
  return metres
}

export function scaleDisagreements(refs: ScaleRef[], horizon: Horizon | null = null): string[] {
  const messages: string[] = []
  if (refs.some((ref) => !usableRef(ref))) {
    messages.push('A locked scale is zero or not a real number, so it was ignored.')
  }
  const usable = usableRefs(refs)
  if (horizonReady(horizon)) {
    const above = usable.some((ref) => {
      const ground = horizonGroundDistance(ref.at, horizon)
      return ground == null || !(ground > ON_HORIZON_PX)
    })
    if (above) {
      messages.push('A lock sits on or above the horizon, so it cannot set a sea-level scale.')
    }
  }
  for (let i = 0; i < usable.length; i++) {
    for (let j = i + 1; j < usable.length; j++) {
      const ratio =
        Math.max(usable[i].metresPerPx, usable[j].metresPerPx) /
        Math.min(usable[i].metresPerPx, usable[j].metresPerPx)
      const gap = ratio - 1
      if (gap > SCALE_DISAGREE) {
        messages.push(
          `Refs disagree by ${(gap * 100).toFixed(0)}% — check the assigned lengths, or add a horizon if scale changes with depth.`,
        )
      }
    }
  }
  return messages
}
