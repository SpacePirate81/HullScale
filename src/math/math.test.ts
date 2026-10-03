import { describe, expect, it } from 'vitest'
import {
  CLICK_PX,
  CU_METRES_PER_CU_FOOT,
  DECISIONS,
  coneVolume,
  cylinderMeasure,
  cylinderVolume,
  errorBar,
  fromCubicMetres,
  fromMetres,
  fromSquareMetres,
  lengthAlongShip,
  lengthOutOfPlane,
  lengthVertical,
  libraryById,
  metresPerPixel,
  photoLength,
  pixelsPerMetre,
  prismVolume,
  projectedArea,
  riseAndRun,
  scaleAt,
  scaleDisagreements,
  SQ_METRES_PER_SQ_FOOT,
  toMetres,
  trueArea,
  type ScaleRef,
} from './index'

const px = (x: number, y: number) => ({ x, y })

function lock(metres: number, pixelLength: number, at = px(0, 0)): ScaleRef {
  const mpp = metresPerPixel(metres, pixelLength)
  if (mpp == null) throw new Error('lock failed')
  return { at, metresPerPx: mpp }
}

describe('1. units', () => {
  it('converts the named lengths exactly', () => {
    expect(fromMetres(294, 'ft')).toBeCloseTo(294 / 0.3048, 10)
    expect(toMetres(1, 'km')).toBe(1000)
    expect(toMetres(1, 'mi')).toBe(1609.344)
    expect(fromSquareMetres(SQ_METRES_PER_SQ_FOOT, 'ft')).toBeCloseTo(1, 10)
    expect(fromCubicMetres(CU_METRES_PER_CU_FOOT, 'ft')).toBeCloseTo(1, 10)
    expect(fromSquareMetres(10, 'm')).toBe(10)
    expect(fromCubicMetres(10, 'km')).toBe(10)
  })
})

describe('2. scale lock', () => {
  it('reads the plate scales', () => {
    expect(metresPerPixel(294, 1176)).toBeCloseTo(0.25, 12)
    expect(pixelsPerMetre(0.25)).toBe(4)
    expect(metresPerPixel(70, 840)).toBeCloseTo(1 / 12, 12)
    expect(metresPerPixel(24.73, 593.52)).toBeCloseTo(1 / 24, 12)
  })
})

describe('3. reference library', () => {
  it('uses the plate length for Starship and keeps 52 m as a note only', () => {
    expect(libraryById('starship-l')?.metres).toBe(50.3)
    expect(DECISIONS.starshipLengthAlternativeM).toBe(52)
    expect(libraryById('starship-l')?.metres).not.toBe(DECISIONS.starshipLengthAlternativeM)
    expect(libraryById('iso40-w')?.metres).toBe(2.438)
    expect(libraryById('neopanamax-air')?.metres).toBe(57.91)
    expect(libraryById('qv-l')?.metres).toBe(294)
    expect(libraryById('falcon-h')?.metres).toBe(70)
    expect(libraryById('tug-l')?.metres).toBe(24.73)
  })
})

describe('4. other lengths on the same plate', () => {
  const plates: { name: string; pxPerM: number; checks: [string, number, number][] }[] = [
    {
      name: 'Queen Victoria',
      pxPerM: 4,
      checks: [
        ['beam', 32.3, 129.2],
        ['extreme beam', 36.6, 146.4],
        ['draft', 8, 32],
        ['keel to funnel', 62.5, 250],
      ],
    },
    {
      name: 'Falcon 9',
      pxPerM: 12,
      checks: [
        ['diameter', 3.7, 44.4],
        ['fairing diameter', 5.2, 62.4],
        ['fairing height', 13.1, 157.2],
        ['first stage', 47.7, 572.4],
      ],
    },
    {
      name: 'Harbor tug',
      pxPerM: 24,
      checks: [
        ['beam', 13.13, 315.12],
        ['draft', 6.5, 156],
        ['person', 1.75, 42],
      ],
    },
    {
      name: 'Neo-Panamax',
      pxPerM: 4,
      checks: [
        ['length', 366, 1464],
        ['beam', 51.25, 205],
        ['draft', 15.2, 60.8],
        ['ISO 40ft', 12.192, 48.768],
      ],
    },
    {
      name: 'OCISLY',
      pxPerM: 10,
      checks: [
        ['length', 91, 910],
        ['beam', 52, 520],
        ['Falcon diameter', 3.7, 37],
        ['leg span', 18, 180],
      ],
    },
    {
      name: 'Vanguard elevation',
      pxPerM: 4,
      checks: [
        ['length', 275, 1100],
        ['depth', 15.5, 62],
        ['Starship diameter', 9, 36],
        ['Starship length', 50.3, 201.2],
      ],
    },
    {
      name: 'Vanguard plan',
      pxPerM: 4,
      checks: [
        ['deck length', 275, 1100],
        ['deck beam', 70, 280],
        ['overall beam', 78.75, 315],
      ],
    },
    {
      name: 'Calibration',
      pxPerM: 4,
      checks: [
        ['Vanguard length', 275, 1100],
        ['deck beam', 70, 280],
        ['overall beam', 78.75, 315],
        ['depth', 15.5, 62],
        ['Starship diameter', 9, 36],
        ['Starship length', 50.3, 201.2],
      ],
    },
  ]

  it('converts each declared pixel length at the plate scale', () => {
    for (const plate of plates) {
      const refs = [lock(1, plate.pxPerM, px(0, 0))]
      for (const [label, metres, pixels] of plate.checks) {
        const reading = photoLength(px(0, 0), px(pixels, 0), refs, null)
        expect(reading, `${plate.name} ${label}`).toBeCloseTo(metres, 6)
      }
    }
    const near = [lock(1, 40)]
    expect(photoLength(px(0, 0), px(70, 0), near, null)).toBeCloseTo(1.75, 8)
    expect(photoLength(px(0, 0), px(180, 0), near, null)).toBeCloseTo(4.5, 8)
  })

  it('Queen Victoria beam is 32.3 m after locking 294 m on 1176 px', () => {
    const refs = [lock(294, 1176, px(588, 780))]
    const beam = photoLength(px(1588.6, 600), px(1717.8, 600), refs, null)
    expect(beam).toBeCloseTo(32.3, 8)
  })
})

describe('5. two locks', () => {
  it('averages equal scales and warns only past 8 percent', () => {
    const same = [lock(10, 40, px(0, 0)), lock(20, 80, px(10, 0))]
    expect(scaleDisagreements(same)).toEqual([])
    expect(scaleAt(px(0, 0), same, null)).toBeCloseTo(0.25, 10)

    const ten = [lock(10, 40), { at: px(1, 0), metresPerPx: 0.25 * 1.1 }]
    expect(scaleDisagreements(ten).length).toBe(1)
    expect(scaleDisagreements(ten)[0]).toMatch(/10%/)

    const five = [lock(10, 40), { at: px(1, 0), metresPerPx: 0.25 * 1.05 }]
    expect(scaleDisagreements(five)).toEqual([])
  })
})

describe('6. area', () => {
  it('projects an ISO 40ft rectangle and doubles a face turned 60 degrees', () => {
    const refs = [lock(1, 4)]
    const rect = [px(0, 0), px(48.768, 0), px(48.768, 9.752), px(0, 9.752)]
    const projected = projectedArea(rect, refs, null)
    expect(projected).toBeCloseTo(12.192 * 2.438, 8)
    const turned = trueArea(projected ?? 0, 60)
    expect(turned.metres2).toBeCloseTo((projected ?? 0) * 2, 8)
    expect(turned.corrected).toBe(true)
    expect(trueArea(projected ?? 0, null).corrected).toBe(false)
  })
})

describe('7. prism', () => {
  const refs = [lock(1, 1)]
  const box = (w: number, h: number) => [px(0, 0), px(w, 0), px(w, h), px(0, h)]

  it('multiplies the three axes and keeps the smaller shared direction', () => {
    const two = prismVolume(
      [
        { facing: 'front', points: box(10, 4) },
        { facing: 'side', points: box(20, 4) },
      ],
      refs,
      null,
    )
    expect(two.volumeM3).toBeCloseTo(800, 8)

    const three = prismVolume(
      [
        { facing: 'front', points: box(10, 4) },
        { facing: 'side', points: box(20, 4) },
        { facing: 'top', points: box(9, 20) },
      ],
      refs,
      null,
    )
    expect(three.volumeM3).toBeCloseTo(720, 8)

    const one = prismVolume([{ facing: 'front', points: box(10, 4) }], refs, null)
    expect(one.volumeM3).toBeNull()
  })
})

describe('8. cylinder, and the cone kept separate', () => {
  it('recovers Falcon 9 from parallel rails', () => {
    const railA: [ReturnType<typeof px>, ReturnType<typeof px>] = [px(0, 0), px(840, 0)]
    const railB: [ReturnType<typeof px>, ReturnType<typeof px>] = [px(0, 44.4), px(840, 44.4)]
    const body = cylinderMeasure(railA, railB, 3.7, [], null)
    expect(body.lengthM).toBeCloseTo(70, 6)
    expect(body.volumeM3).toBeCloseTo(cylinderVolume(3.7, 70), 6)
    expect(body.volumeM3).toBeCloseTo(Math.PI * 1.85 * 1.85 * 70, 6)
    expect(coneVolume(3.7, 70)).toBeCloseTo((body.volumeM3 ?? 0) / 3, 6)
    expect(body.volumeM3).not.toBeCloseTo(coneVolume(3.7, 70), 4)
  })

  it('treats a taper in the photo as perspective, not a cone', () => {
    const lengthPx = 100
    const w0 = 40
    const w1 = 20
    const diameter = 10
    const railA: [ReturnType<typeof px>, ReturnType<typeof px>] = [px(0, -w0 / 2), px(lengthPx, -w1 / 2)]
    const railB: [ReturnType<typeof px>, ReturnType<typeof px>] = [px(0, w0 / 2), px(lengthPx, w1 / 2)]
    const body = cylinderMeasure(railA, railB, diameter, [], null)
    const analytical = (diameter * lengthPx * Math.log(w1 / w0)) / (w1 - w0)
    expect(body.lengthM).toBeCloseTo(analytical, 2)
    expect(body.volumeM3).toBeCloseTo(cylinderVolume(diameter, body.lengthM ?? 0), 8)
    expect(DECISIONS.showCylinderVolume).toBe(true)
  })
})

describe('9. horizon direction', () => {
  it('gives a nearer point twice the pixels per metre', () => {
    const horizon = { a: px(0, 0), b: px(1000, 0) }
    const refs = [{ at: px(0, 100), metresPerPx: 0.25 }]
    const nearer = scaleAt(px(0, 200), refs, horizon)
    expect(nearer).toBeCloseTo(0.125, 10)
    expect(pixelsPerMetre(nearer ?? 1)).toBeCloseTo(8, 10)
    expect(pixelsPerMetre(0.25)).toBe(4)
  })

  it('ignores a waterline: with no horizon the scale stays flat', () => {
    expect(DECISIONS.waterlineAffectsScale).toBe(false)
    const refs = [lock(294, 1176, px(0, 100))]
    const onTheHull = scaleAt(px(0, 400), refs, null)
    expect(onTheHull).toBeCloseTo(294 / 1176, 12)
  })
})

describe('10. angles and the error bar', () => {
  it('solves a 3-4-5 triangle and a 60 degree turn', () => {
    expect(riseAndRun(3, 4)).toBeCloseTo(5, 12)
    const turned = lengthOutOfPlane(10, 60)
    expect(turned.metres).toBeCloseTo(20, 10)
    expect(turned.corrected).toBe(true)
    const unset = lengthOutOfPlane(32.3, null)
    expect(unset.metres).toBeCloseTo(32.3, 10)
    expect(unset.corrected).toBe(false)
    expect(unset.warning).toMatch(/uncorrected/i)
  })

  it('leaves plate readings unchanged at zero yaw and pitch', () => {
    expect(lengthAlongShip(32.3, 0).metres).toBeCloseTo(32.3, 10)
    expect(lengthVertical(62.5, 0).metres).toBeCloseTo(62.5, 10)
    expect(lengthAlongShip(32.3, 0).corrected).toBe(true)
  })

  it('keeps a finger click on Queen Victoria under 1 percent', () => {
    const bar = errorBar({
      metres: 294,
      lengthPx: 1176,
      clickClass: 'finger',
      edgeA: 'clean',
      edgeB: 'clean',
      referenceClicked: false,
      knownMetres: 294,
      toleranceMetres: 0,
      plane: 'same',
      angleDeg: 0,
    })
    expect(CLICK_PX.finger.clean).toBe(4)
    expect(bar.rel).toBeLessThan(0.01)
    expect(bar.tone).not.toBe('red')
  })

  it('flags the tug person line as too short and above 7 percent', () => {
    const bar = errorBar({
      metres: 1.75,
      lengthPx: 42,
      clickClass: 'finger',
      referenceClicked: true,
      refPx: 593.52,
      knownMetres: 24.73,
      toleranceMetres: 0,
      plane: 'same',
      angleDeg: 0,
    })
    expect(bar.rel).toBeGreaterThan(0.07)
    expect(bar.tone).toBe('red')
    expect(bar.warnings.some((w) => w.text.includes('too few pixels'))).toBe(true)
  })

  it('widens the bar for angle doubt without moving the reading', () => {
    const steady = errorBar({
      metres: 20,
      lengthPx: 400,
      referenceClicked: false,
      angleDeg: 60,
      angleUncertaintyDeg: 0,
      plane: 'same',
    })
    const loose = errorBar({
      metres: 20,
      lengthPx: 400,
      referenceClicked: false,
      angleDeg: 60,
      angleUncertaintyDeg: 2,
      plane: 'same',
    })
    expect(loose.rel).toBeGreaterThan(steady.rel)
    expect(lengthOutOfPlane(10, 60).metres).toBeCloseTo(20, 10)
  })
})
