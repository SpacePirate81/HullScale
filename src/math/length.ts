import { DECISIONS } from './decisions'
import { distance, finitePoint, type Point } from './geometry'
import { integrateLength, type Horizon, type ScaleRef } from './scale'

const EDGE_ON = 1e-6

/** Out-of-plane angles stay inside this. Outside it, cosine is negative or the length explodes. */
export const PLANE_ANGLE_LIMIT_DEG = 89

/** At and beyond this, a one-degree miss moves the reading by more than about 6 percent. */
export const STEEP_PLANE_ANGLE_DEG = 75

export type LengthResult = {
  metres: number | null
  corrected: boolean
  warning: string | null
}

export type CosineCorrection = {
  value: number | null
  corrected: boolean
  warning: string | null
}

const UNCORRECTED = 'Angle not set. Length is uncorrected. Nearer objects read large, farther read small.'

const RANGE_WARNING = `Angle must be between -${PLANE_ANGLE_LIMIT_DEG} and ${PLANE_ANGLE_LIMIT_DEG} degrees. The reading stays uncorrected.`

const INVALID_ANGLE = 'Angle is not a real number. The reading stays uncorrected.'

const STEEP_WARNING = 'That angle is steep. A small error in it changes the reading a lot.'

const NOT_A_MEASUREMENT = 'The measurement is not a real number, so the angle cannot be applied.'

/**
 * Divide a photo measurement by the cosine of an out-of-plane angle.
 * Angles outside ±89° are refused. Steep angles still correct, and they carry a warning.
 */
export function correctByCosine(
  photoValue: number,
  angleDeg: number | null | undefined,
  edgeWarning: string,
): CosineCorrection {
  if (!Number.isFinite(photoValue)) {
    return { value: null, corrected: false, warning: NOT_A_MEASUREMENT }
  }
  if (angleDeg == null) {
    return { value: photoValue, corrected: false, warning: null }
  }
  if (!Number.isFinite(angleDeg)) {
    return { value: photoValue, corrected: false, warning: INVALID_ANGLE }
  }
  const magnitude = Math.abs(angleDeg)
  if (magnitude > PLANE_ANGLE_LIMIT_DEG) {
    return { value: photoValue, corrected: false, warning: RANGE_WARNING }
  }
  const cos = Math.cos((magnitude * Math.PI) / 180)
  if (!(Math.abs(cos) > EDGE_ON)) {
    return { value: photoValue, corrected: false, warning: edgeWarning }
  }
  return {
    value: photoValue / cos,
    corrected: true,
    warning: magnitude >= STEEP_PLANE_ANGLE_DEG ? STEEP_WARNING : null,
  }
}

function unsetWarning(): string {
  if (!DECISIONS.angleOptional) {
    return 'Set the out-of-plane angle. Length stays uncorrected until you do.'
  }
  return UNCORRECTED
}

function divideByCos(photoMetres: number, angleDeg: number | null | undefined): LengthResult {
  const corrected = correctByCosine(
    photoMetres,
    angleDeg,
    'That angle is edge-on, so the length cannot be recovered from the photo.',
  )
  if (angleDeg == null && corrected.warning == null) {
    return { metres: corrected.value, corrected: false, warning: unsetWarning() }
  }
  return { metres: corrected.value, corrected: corrected.corrected, warning: corrected.warning }
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

/** Why a line cannot be scaled. Null when the photo length is a real number, including zero-angle lines. */
export function photoLengthIssue(a: Point, b: Point, refs: ScaleRef[], horizon: Horizon | null): string | null {
  if (!finitePoint(a) || !finitePoint(b)) return 'That line has coordinates that are not real numbers.'
  if (!(distance(a, b) > 1e-6)) return 'That line has no length.'
  const usable = refs.filter((ref) => finitePoint(ref.at) && Number.isFinite(ref.metresPerPx) && ref.metresPerPx > 0)
  if (refs.length > 0 && usable.length === 0) return 'The locked scale is zero or not a real number.'
  if (usable.length === 0) return null
  if (photoLength(a, b, refs, horizon) == null) {
    return 'No sea-level scale applies to that line. Points on or above the horizon are left unscaled.'
  }
  return null
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
 * Out-of-range and non-real angles contribute nothing, because the reading was not corrected.
 */
export function angleShare(angleDeg: number | null | undefined, uncertaintyDeg: number | null | undefined): number {
  if (angleDeg == null || uncertaintyDeg == null) return 0
  if (!Number.isFinite(angleDeg) || !Number.isFinite(uncertaintyDeg) || !(uncertaintyDeg > 0)) return 0
  if (Math.abs(angleDeg) > PLANE_ANGLE_LIMIT_DEG) return 0
  const share = Math.abs(Math.tan((Math.abs(angleDeg) * Math.PI) / 180)) * ((uncertaintyDeg * Math.PI) / 180)
  return Number.isFinite(share) ? share : 0
}
