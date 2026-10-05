import { describe, expect, it } from 'vitest'
import { DEFAULT_INK, INKS, inkById, inkLabel, inkStroke } from './palette'

describe('overlay palette', () => {
  it('keeps the eight v0.9.4 inks, with cyan as the default', () => {
    expect(INKS.map((ink) => ink.id)).toEqual(['red', 'orange', 'gold', 'lime', 'cyan', 'blue', 'purple', 'white'])
    expect(DEFAULT_INK).toBe('cyan')
    expect(inkStroke('cyan')).toBe('#7ec8c0')
    expect(inkStroke(undefined)).toBe('#7ec8c0')
    expect(inkById('nope').id).toBe('cyan')
  })

  it('picks a readable letter color for light and dark swatches', () => {
    expect(inkLabel(inkStroke('white'))).toBe('#141618')
    expect(inkLabel(inkStroke('gold'))).toBe('#141618')
    expect(inkLabel(inkStroke('lime'))).toBe('#141618')
    expect(inkLabel(inkStroke('cyan'))).toBe('#141618')
    expect(inkLabel(inkStroke('red'))).toBe('#f4f6f8')
    expect(inkLabel(inkStroke('blue'))).toBe('#f4f6f8')
    expect(inkLabel(inkStroke('purple'))).toBe('#f4f6f8')
  })
})
