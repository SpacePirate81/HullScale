/**
 * Owner decisions for the rebuild. Change a value here and the engine follows.
 * Recorded when the math-engine plan was approved.
 */
export const DECISIONS = {
  /** Plates draw Starship at 50.3 m. The old library figure was 52 m. */
  starshipLengthM: 50.3,
  /**
   * Noted alternative only. Do not use this for a lock.
   * The compiled v0.9.4 library called the ship 52 m; the plates use 50.3 m.
   */
  starshipLengthAlternativeM: 52,
  /** A horizon line changes metres-per-pixel with distance from that line. */
  horizonAffectsScale: true,
  /** A waterline is a mark. It never changes scale. */
  waterlineAffectsScale: false,
  /** Cylinder volume is part of the readout, not only an internal number. */
  showCylinderVolume: true,
  /** An out-of-plane angle is optional. Unset leaves the length uncorrected. */
  angleOptional: true,
} as const
