import { describe, expect, it } from 'vitest'
import type { LengthUnit } from '../math'
import { buildReport, collectRefs, reportText } from './report'
import type { Annotation, AreaAnn, PlateDoc } from './types'

const unit: LengthUnit = 'm'

function plate(annotations: Annotation[], structures: PlateDoc['structures'] = [{ id: 's', name: 'Hull' }]): PlateDoc {
  return {
    id: 'plate',
    name: 'Bridge',
    src: '/samples/calibration.svg',
    width: 2000,
    height: 1200,
    annotations,
    structures,
    clickClass: 'finger',
  }
}

function measure(
  id: string,
  a: { x: number; y: number },
  b: { x: number; y: number },
  extra: Partial<Extract<Annotation, { kind: 'measure' }>> = {},
): Annotation {
  return {
    id,
    kind: 'measure',
    role: 'measure',
    a,
    b,
    label: id,
    angleDeg: null,
    plane: 'same',
    referenceClicked: true,
    ...extra,
  }
}

describe('report bridge', () => {
  it('reads a level reference and a vertical reference back as their known lengths', () => {
    const level = plate([
      { id: 'h', kind: 'horizon', a: { x: -500, y: 0 }, b: { x: 1500, y: 0 } },
      measure('level', { x: 0, y: 100 }, { x: 200, y: 100 }, { role: 'reference', knownMetres: 50, label: 'Level' }),
    ])
    const levelReport = buildReport(level, unit)
    expect(levelReport.horizon).toBe(true)
    expect(levelReport.measures[0]?.metres).toBeCloseTo(50, 6)

    const mast = plate([
      { id: 'h', kind: 'horizon', a: { x: 800, y: 0 }, b: { x: -800, y: 0 } },
      measure('mast', { x: 0, y: -60 }, { x: 0, y: 120 }, { role: 'reference', knownMetres: 18, label: 'Mast' }),
      measure('beam', { x: -50, y: 120 }, { x: 50, y: 120 }, { label: 'Beam' }),
    ])
    const refs = collectRefs(mast)
    expect(refs).toHaveLength(1)
    expect(refs[0]?.at.y).toBeCloseTo(120, 6)
    const mastReport = buildReport(mast, unit)
    expect(mastReport.measures.find((row) => row.id === 'mast')?.metres).toBeCloseTo(18, 6)
    expect(mastReport.measures.find((row) => row.id === 'beam')?.metres).toBeCloseTo(10, 6)
  })

  it('leaves points on or above the horizon unscaled', () => {
    const doc = plate([
      { id: 'h', kind: 'horizon', a: { x: 0, y: 0 }, b: { x: 1000, y: 0 } },
      measure('lock', { x: 0, y: 100 }, { x: 100, y: 100 }, { role: 'reference', knownMetres: 25, label: 'Lock' }),
      measure('sky', { x: 0, y: -40 }, { x: 80, y: -40 }, { label: 'Sky' }),
      measure('line', { x: 0, y: 0 }, { x: 80, y: 0 }, { label: 'On horizon' }),
    ])
    const report = buildReport(doc, unit)
    const sky = report.measures.find((row) => row.id === 'sky')
    const onLine = report.measures.find((row) => row.id === 'line')
    expect(sky?.metres).toBeNull()
    expect(onLine?.metres).toBeNull()
    expect(sky?.warning).toMatch(/horizon/i)
    expect(onLine?.warning).toMatch(/horizon/i)
    expect(reportText(doc, unit)).toMatch(/horizon/i)
  })

  it('does not let a waterline change the scale', () => {
    const lock = measure('lock', { x: 0, y: 100 }, { x: 100, y: 100 }, { role: 'reference', knownMetres: 25 })
    const target = measure('target', { x: 0, y: 400 }, { x: 80, y: 400 })
    const plain = buildReport(plate([lock, target]), unit)
    const withWater = buildReport(
      plate([lock, target, { id: 'w', kind: 'waterline', a: { x: 0, y: 500 }, b: { x: 800, y: 500 } }]),
      unit,
    )
    expect(plain.measures.find((row) => row.id === 'target')?.metres).toBeCloseTo(20, 6)
    expect(withWater.measures.find((row) => row.id === 'target')?.metres).toBeCloseTo(20, 6)
    expect(withWater.horizon).toBe(false)
  })

  it('labels the prism as an upper bound and keeps a turned plan', () => {
    const box = (id: string, facing: 'front' | 'side' | 'top', w: number, h: number): AreaAnn => ({
      id,
      kind: 'area',
      facing,
      structureId: 's',
      turnDeg: null,
      points: [
        { x: 0, y: 0 },
        { x: w, y: 0 },
        { x: w, y: h },
        { x: 0, y: h },
      ],
    })
    const doc = plate(
      [
        measure('lock', { x: 0, y: 0 }, { x: 1, y: 0 }, { role: 'reference', knownMetres: 1 }),
        box('front', 'front', 70, 15.5),
        box('side', 'side', 275, 15.5),
        box('top', 'top', 275, 70),
      ],
      [{ id: 's', name: 'Vanguard' }],
    )
    const report = buildReport(doc, unit)
    expect(report.prisms[0]?.text).toMatch(/upper bound/)
    expect(report.prisms[0]?.text).not.toMatch(/lower bound/i)
    expect(report.prisms[0]?.note).toMatch(/left-right/)
    expect(report.prisms[0]?.note).toMatch(/upper-bound/i)
    const forced = plate(
      [
        measure('lock', { x: 0, y: 0 }, { x: 1, y: 0 }, { role: 'reference', knownMetres: 1 }),
        box('front', 'front', 70, 15.5),
        box('side', 'side', 275, 15.5),
        { ...box('top', 'top', 275, 70), lengthAxis: 'y' },
      ],
      [{ id: 's', name: 'Vanguard' }],
    )
    const wrong = buildReport(forced, unit)
    expect(wrong.prisms[0]?.note).toMatch(/does not match/)
    expect(wrong.prisms[0]?.text).not.toBe(report.prisms[0]?.text)
  })

  it('measures a cylinder the same way when the second rail runs backwards', () => {
    const body = (railB: [{ x: number; y: number }, { x: number; y: number }]) =>
      plate([
        {
          id: 'cyl',
          kind: 'cylinder',
          label: 'Falcon',
          knownDiameterMetres: 3.7,
          railA: [
            { x: 0, y: 0 },
            { x: 840, y: 0 },
          ],
          railB,
        },
      ])
    const forward = buildReport(
      body([
        { x: 0, y: 44.4 },
        { x: 840, y: 44.4 },
      ]),
      unit,
    )
    const backward = buildReport(
      body([
        { x: 840, y: 44.4 },
        { x: 0, y: 44.4 },
      ]),
      unit,
    )
    expect(forward.cylinders[0]?.text).toMatch(/70\.00 m/)
    expect(backward.cylinders[0]?.text).toBe(forward.cylinders[0]?.text)
    expect(backward.cylinders[0]?.note).not.toMatch(/no length/i)
  })

  it('warns on a zero-length line, a bad angle, and a zero lock', () => {
    const doc = plate([
      measure('lock', { x: 0, y: 0 }, { x: 100, y: 0 }, { role: 'reference', knownMetres: 100 }),
      measure('dot', { x: 10, y: 10 }, { x: 10, y: 10 }),
      measure('bad', { x: 0, y: 20 }, { x: 40, y: 20 }, { angleDeg: Number.POSITIVE_INFINITY }),
      measure('nan', { x: 0, y: 30 }, { x: 40, y: 30 }, { angleDeg: Number.NaN }),
      measure('zero', { x: 0, y: 40 }, { x: 10, y: 40 }, { knownMetres: 0 }),
    ])
    const report = buildReport(doc, unit)
    expect(report.measures.find((row) => row.id === 'dot')?.warning).toMatch(/no length/i)
    expect(report.measures.find((row) => row.id === 'dot')?.metres).toBeNull()
    const bad = report.measures.find((row) => row.id === 'bad')
    expect(bad?.metres).toBeCloseTo(40, 6)
    expect(bad?.warning).toMatch(/not a real number/i)
    expect(report.measures.find((row) => row.id === 'nan')?.metres).toBeCloseTo(40, 6)
    expect(report.flags.some((flag) => /zero or not a real number/i.test(flag))).toBe(true)
    expect(report.pxPerM).toBeCloseTo(1, 6)
    const text = reportText(doc, unit)
    expect(text).toMatch(/no length/i)
    expect(text).toMatch(/not a real number/i)
  })

  it('keeps a steep angle finite and visible on the copied report', () => {
    const doc = plate([
      measure('lock', { x: 0, y: 0 }, { x: 10, y: 0 }, { role: 'reference', knownMetres: 10 }),
      measure('yaw', { x: 0, y: 10 }, { x: 10, y: 10 }, { angleDeg: 80 }),
    ])
    const row = buildReport(doc, unit).measures.find((item) => item.id === 'yaw')
    expect(row?.metres).toBeCloseTo(10 / Math.cos((80 * Math.PI) / 180), 6)
    expect(row?.warning).toMatch(/steep/i)
    expect(reportText(doc, unit)).toMatch(/steep/i)
  })
})
