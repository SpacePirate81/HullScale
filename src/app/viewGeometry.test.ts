import { describe, expect, it } from 'vitest'
import { clientToImage, clientToImageBox, imageToClient, plateImageStyle } from './viewGeometry'

describe('plate overlay coordinates', () => {
  it('round-trips a click through pan and zoom', () => {
    const origin = { left: 80, top: 40 }
    const view = { x: 24.5, y: 166.25, scale: 0.6125 }
    const image = { x: 1588.6, y: 600 }
    const client = imageToClient(image, origin, view)
    const back = clientToImage(client.x, client.y, origin, view)
    expect(back.x).toBeCloseTo(image.x, 6)
    expect(back.y).toBeCloseTo(image.y, 6)
  })

  it('reads a click from the rendered image box at any size', () => {
    const box = { left: 12, top: 90, width: 384, height: 216 }
    const point = clientToImageBox(12 + 384 * (120 / 1920), 90 + 216 * (780 / 1080), box, 1920, 1080)
    expect(point.x).toBeCloseTo(120, 6)
    expect(point.y).toBeCloseTo(780, 6)
  })

  it('keeps the plate image out of the page-wide max-width rule', () => {
    expect(plateImageStyle.maxWidth).toBe('none')
    expect(plateImageStyle.width).toBe('100%')
    expect(plateImageStyle.height).toBe('100%')
  })
})
