import { DECISIONS } from './decisions'
import type { Point } from './geometry'
import type { Horizon, ScaleRef } from './scale'
import { integrateLength } from './scale'

const EDGE_ON = 1e-6

export type LengthResult = {
  metres: number
  corrected: boolean
  warning: string | null
}

const UNCORRECTED =
  'Angle not set. Length is uncorrected. Nearer objects read large, farther read small.'

function divideByCos(photoMetres: number, angleDeg: number | null | undefined): LengthResult {
  if (angleDeg == null || Number.isNaN(angleDeg)) {
    if (!DECISIONS.angleOptional) {
      return {
        metres: photoMetres,
        corrected: false,
        warning: 'Set the out-of-plane angle. Length stays uncorrected until you do.',
      }
    }
    return { metres: photoMetres, corrected: false, warning: UNCORRECTED }
  }
  const cos = Math.cos((angleDeg * Math.PI) / 180)
  if (Math.abs(cos) < EDGE_ON) {
    return {
      metres: photoMetres,
      corrected: false,
      warning: 'That angle is edge-on, so the length cannot be recovered from the photo.',
    }
  }
  return { metres: photoMetres / cos, corrected: true, warning: null }
}

/** Photo length of a straight line, before any out-of-plane angle. */
export function photoLength(
  a: Point,
  b: Point,
  refs: ScaleRef[],
  horizon: Horizon | null,
  steps = 8,
): number | null {
  return integrateLength(a, b, refs, horizon, steps)
}

/**
 * A length turned by `angleDeg` out of the plane the scale was locked on.
 * Zero is square-on. Unset leaves the photo length alone and keeps the warning.
 */
export function lengthOutOfPlane(photoMetres: number, angleDeg: number | null | undefined): LengthResult {
  return divideByCos(photoMetres, angleDeg)
}

/** Along the ship, with the ship yawed by `yawDeg` from square-on. */
export function lengthAlongShip(photoMetres: number, yawDeg: number | null | undefined): LengthResult {
  return divideByCos(photoMetres, yawDeg)
}

/** A vertical length, with the camera pitched by `pitchDeg` from square-on. */
export function lengthVertical(photoMetres: number, pitchDeg: number | null | undefined): LengthResult {
  return divideByCos(photoMetres, pitchDeg)
}

/** When the flat run and the rise are both known. */
export function riseAndRun(run: number, rise: number): number {
  return Math.hypot(run, rise)
}

/**
 * Share of the reading that moves when the angle is uncertain.
 * `uncertaintyDeg` is the doubt in the angle. The central reading does not use this.
 */
export function angleShare(angleDeg: number | null | undefined, uncertaintyDeg: number | null | undefined): number {
  if (angleDeg == null || uncertaintyDeg == null || !(uncertaintyDeg > 0)) return 0
  const radians = (uncertaintyDeg * Math.PI) / 180
  return Math.abs(Math.tan((angleDeg * Math.PI) / 180)) * radians
}
