export const LENGTH_UNITS = ['m', 'ft', 'km', 'mi'] as const
export type LengthUnit = (typeof LENGTH_UNITS)[number]

/** Metres in one of each display unit. */
export const METRES_PER_UNIT: Record<LengthUnit, number> = {
  m: 1,
  ft: 0.3048,
  km: 1000,
  mi: 1609.344,
}

export const SQ_METRES_PER_SQ_FOOT = 0.09290304
export const CU_METRES_PER_CU_FOOT = 0.028316846592

export type AreaUnit = 'm2' | 'ft2'
export type VolumeUnit = 'm3' | 'ft3'

export function toMetres(value: number, unit: LengthUnit): number {
  return value * METRES_PER_UNIT[unit]
}

export function fromMetres(metres: number, unit: LengthUnit): number {
  return metres / METRES_PER_UNIT[unit]
}

/** The other of metres and feet. Kilometres still pair with feet; miles with metres. */
export function partnerUnit(unit: LengthUnit): LengthUnit {
  return unit === 'm' || unit === 'km' ? 'ft' : 'm'
}

export function areaUnitFor(unit: LengthUnit): AreaUnit {
  return unit === 'ft' || unit === 'mi' ? 'ft2' : 'm2'
}

export function volumeUnitFor(unit: LengthUnit): VolumeUnit {
  return unit === 'ft' || unit === 'mi' ? 'ft3' : 'm3'
}

export function fromSquareMetres(m2: number, unit: LengthUnit): number {
  return areaUnitFor(unit) === 'ft2' ? m2 / SQ_METRES_PER_SQ_FOOT : m2
}

export function fromCubicMetres(m3: number, unit: LengthUnit): number {
  return volumeUnitFor(unit) === 'ft3' ? m3 / CU_METRES_PER_CU_FOOT : m3
}

export function unitLabel(unit: LengthUnit): string {
  return unit
}

export function areaLabel(unit: LengthUnit): string {
  return areaUnitFor(unit) === 'ft2' ? 'ft²' : 'm²'
}

export function volumeLabel(unit: LengthUnit): string {
  return volumeUnitFor(unit) === 'ft3' ? 'ft³' : 'm³'
}

/** Same rounding the v0.9.4 readout used. */
export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return '—'
  const t = Math.abs(value)
  if (t === 0) return '0'
  if (t >= 1000) return value.toLocaleString(undefined, { maximumFractionDigits: 1 })
  if (t >= 100) return value.toFixed(1)
  if (t >= 10) return value.toFixed(2)
  if (t >= 1) return value.toFixed(3)
  if (t >= 0.01) return value.toFixed(4)
  return value.toExponential(2)
}

export function formatLength(metres: number, unit: LengthUnit): string {
  return `${formatNumber(fromMetres(metres, unit))} ${unitLabel(unit)}`
}

export function formatLengthPair(metres: number, unit: LengthUnit): string {
  return `${formatLength(metres, unit)}  ·  ${formatLength(metres, partnerUnit(unit))}`
}

export function formatArea(m2: number, unit: LengthUnit): string {
  return `${formatNumber(fromSquareMetres(m2, unit))} ${areaLabel(unit)}`
}

export function formatVolume(m3: number, unit: LengthUnit): string {
  return `${formatNumber(fromCubicMetres(m3, unit))} ${volumeLabel(unit)}`
}
