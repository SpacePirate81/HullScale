import { distance, lerp, lineDistance, midpoint, type Point } from './geometry'
import { DECISIONS } from './decisions'

export type ScaleRef = {
  id?: string
  at: Point
  metresPerPx: number
}

export type Horizon = { a: Point; b: Point }

/** Two locks farther apart than this (as a fraction) raise a warning. */
export const SCALE_DISAGREE = 0.08

const MIN_LINE_PX = 1e-6
const MIN_HORIZON_PX = 1

export function metresPerPixel(knownMetres: number, pixelLength: number): number | null {
  if (!(knownMetres > 0) || !(pixelLength > MIN_LINE_PX)) return null
  return knownMetres / pixelLength
}

export function pixelsPerMetre(metresPerPx: number): number {
  return 1 / metresPerPx
}

export function averageMetresPerPx(refs: ScaleRef[]): number | null {
  if (refs.length === 0) return null
  return refs.reduce((sum, ref) => sum + ref.metresPerPx, 0) / refs.length
}

/**
 * Metres per pixel at a point.
 * With no horizon, this is the plain average of the locks.
 * With a horizon, closer to the camera (farther from the horizon) means
 * fewer metres per pixel — the opposite of the v0.9.4 formula.
 * A waterline is never passed in. See DECISIONS.waterlineAffectsScale.
 */
export function scaleAt(point: Point, refs: ScaleRef[], horizon: Horizon | null): number | null {
  if (refs.length === 0) return null
  if (!horizon || !DECISIONS.horizonAffectsScale) return averageMetresPerPx(refs)
  let sum = 0
  let n = 0
  const here = Math.max(lineDistance(point, horizon.a, horizon.b), MIN_HORIZON_PX)
  for (const ref of refs) {
    const there = Math.max(lineDistance(ref.at, horizon.a, horizon.b), MIN_HORIZON_PX)
    sum += ref.metresPerPx * (there / here)
    n += 1
  }
  return n === 0 ? null : sum / n
}

/** Straight length in metres, sampled in equal steps. Eight steps matches v0.9.4. */
export function integrateLength(
  a: Point,
  b: Point,
  refs: ScaleRef[],
  horizon: Horizon | null,
  steps = 8,
): number | null {
  if (refs.length === 0) return null
  let metres = 0
  for (let i = 1; i <= steps; i++) {
    const start = lerp(a, b, (i - 1) / steps)
    const end = lerp(a, b, i / steps)
    const local = scaleAt(midpoint(start, end), refs, horizon)
    if (local == null) return null
    metres += distance(start, end) * local
  }
  return metres
}

export function scaleDisagreements(refs: ScaleRef[]): string[] {
  const messages: string[] = []
  for (let i = 0; i < refs.length; i++) {
    for (let j = i + 1; j < refs.length; j++) {
      const ratio = Math.max(refs[i].metresPerPx, refs[j].metresPerPx) / Math.min(refs[i].metresPerPx, refs[j].metresPerPx)
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
