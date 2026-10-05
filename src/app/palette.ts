/** Overlay colors from HullScale v0.9.4. Each annotation keeps the ink chosen for it. */

export const INKS = [
  { id: 'red', name: 'Red', stroke: '#e02040' },
  { id: 'orange', name: 'Orange', stroke: '#f26b2b' },
  { id: 'gold', name: 'Gold', stroke: '#e4c36a' },
  { id: 'lime', name: 'Lime', stroke: '#8ed94a' },
  { id: 'cyan', name: 'Cyan', stroke: '#7ec8c0' },
  { id: 'blue', name: 'Blue', stroke: '#3a7dff' },
  { id: 'purple', name: 'Purple', stroke: '#c45aff' },
  { id: 'white', name: 'White', stroke: '#e8eef2' },
] as const

export type InkId = (typeof INKS)[number]['id']

export const DEFAULT_INK: InkId = 'cyan'

export function inkById(id: string | null | undefined) {
  return INKS.find((ink) => ink.id === id) ?? INKS.find((ink) => ink.id === DEFAULT_INK)!
}

export function inkStroke(id: string | null | undefined): string {
  return inkById(id).stroke
}

/** Dark or light lettering so a mark stays readable on its swatch. */
export function inkLabel(stroke: string): string {
  const hex = stroke.replace('#', '')
  const full = hex.length === 3 ? [...hex].map((char) => char + char).join('') : hex
  const value = Number.parseInt(full, 16)
  if (!Number.isFinite(value)) return '#f4f6f8'
  const r = (value >> 16) & 255
  const g = (value >> 8) & 255
  const b = value & 255
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
  return luminance > 0.58 ? '#141618' : '#f4f6f8'
}
