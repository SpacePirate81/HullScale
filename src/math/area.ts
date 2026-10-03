import { centroid, shoelace, type Point } from './geometry'
import type { Horizon, ScaleRef } from './scale'
import { scaleAt } from './scale'

const EDGE_ON = 1e-6

export function projectedArea(points: Point[], refs: ScaleRef[], horizon: Horizon | null): number | null {
  if (points.length < 3 || refs.length === 0) return null
  const local = scaleAt(centroid(points), refs, horizon)
  if (local == null) return null
  return shoelace(points) * local * local
}

export function pixelArea(points: Point[]): number {
  return shoelace(points)
}

/**
 * A face turned by `turnDeg` from facing the camera.
 * Unset returns the projected area and a warning.
 */
export function trueArea(
  projectedM2: number,
  turnDeg: number | null | undefined,
): { metres2: number; corrected: boolean; warning: string | null } {
  if (turnDeg == null || Number.isNaN(turnDeg)) {
    return {
      metres2: projectedM2,
      corrected: false,
      warning: 'Face angle not set. Area is the outline as seen in the photo.',
    }
  }
  const cos = Math.cos((turnDeg * Math.PI) / 180)
  if (Math.abs(cos) < EDGE_ON) {
    return {
      metres2: projectedM2,
      corrected: false,
      warning: 'That face is edge-on, so its true area cannot be recovered.',
    }
  }
  return { metres2: projectedM2 / cos, corrected: true, warning: null }
}
