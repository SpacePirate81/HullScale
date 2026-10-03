import { angleShare } from './length'

export type ClickClass = 'finger' | 'stylus' | 'loupe'
export type EdgeKind = 'clean' | 'soft'
export type PlaneTag = 'same' | 'off' | null

export const CLICK_PX: Record<ClickClass, { clean: number; soft: number }> = {
  finger: { clean: 4, soft: 7 },
  stylus: { clean: 2, soft: 4 },
  loupe: { clean: 1, soft: 3 },
}

export type WarningLevel = 'note' | 'amber' | 'red'
export type BarTone = 'ok' | 'amber' | 'red'

export type BarWarning = { level: WarningLevel; text: string }
export type BarTerm = { id: 'click' | 'refClick' | 'refLength' | 'angle' | 'bias'; rel: number }

export type ErrorBar = {
  rel: number
  sigmaM: number | null
  terms: BarTerm[]
  warnings: BarWarning[]
  tone: BarTone
}

export function clickDoubtPx(clickClass: ClickClass, edge: EdgeKind | undefined, customPx?: number | null): number {
  const mode: EdgeKind = edge === 'soft' ? 'soft' : 'clean'
  if (customPx != null && customPx > 0) {
    if (mode === 'clean') return customPx
    const table = CLICK_PX[clickClass]
    return customPx * (table.soft / table.clean)
  }
  return CLICK_PX[clickClass][mode]
}

function hypot(...values: number[]): number {
  return Math.hypot(...values)
}

export type ErrorBarInput = {
  metres: number | null
  lengthPx: number
  clickClass?: ClickClass
  edgeA?: EdgeKind
  edgeB?: EdgeKind
  customClickPx?: number | null
  /** Pixel length of the locked reference. Omit when this line is the reference. */
  refPx?: number | null
  refEdgeA?: EdgeKind
  refEdgeB?: EdgeKind
  referenceClicked?: boolean
  knownMetres?: number | null
  toleranceMetres?: number | null
  angleDeg?: number | null
  angleUncertaintyDeg?: number | null
  plane?: PlaneTag
  biases?: { rel: number }[]
}

export function errorBar(input: ErrorBarInput): ErrorBar {
  const clickClass = input.clickClass ?? 'finger'
  const s1 = clickDoubtPx(clickClass, input.edgeA, input.customClickPx)
  const s2 = clickDoubtPx(clickClass, input.edgeB, input.customClickPx)
  const lengthPx = Math.max(input.lengthPx, 1e-9)
  const clickRel = hypot(s1, s2) / lengthPx

  const refClicked = input.referenceClicked !== false && input.refPx != null && input.refPx > 0
  const refClickRel = refClicked
    ? hypot(
        clickDoubtPx(clickClass, input.refEdgeA, input.customClickPx),
        clickDoubtPx(clickClass, input.refEdgeB, input.customClickPx),
      ) / (input.refPx as number)
    : 0

  const known = input.knownMetres
  const tol = input.toleranceMetres ?? 0
  const refLengthRel = known != null && known > 0 ? Math.max(0, tol) / known : 0
  const turn = angleShare(input.angleDeg, input.angleUncertaintyDeg)
  const bias = (input.biases ?? []).reduce((sum, item) => sum + Math.abs(item.rel), 0)
  const rel = hypot(clickRel, refClickRel, refLengthRel, turn) + bias

  const terms: BarTerm[] = [
    { id: 'click', rel: clickRel },
    { id: 'refClick', rel: refClickRel },
    { id: 'refLength', rel: refLengthRel },
    { id: 'angle', rel: turn },
  ]
  if (bias > 0) terms.push({ id: 'bias', rel: bias })

  const warnings: BarWarning[] = []
  if ((input.toleranceMetres ?? 0) <= 0 && known != null) {
    warnings.push({ level: 'note', text: 'reference tolerance not set' })
  }
  if (input.lengthPx < 150 || (input.refPx != null && input.refPx < 150)) {
    warnings.push({ level: 'amber', text: 'too few pixels for ±5%' })
  }
  if (input.refPx != null && input.refPx > 0 && input.refPx < input.lengthPx / 3) {
    warnings.push({ level: 'amber', text: 'reference much shorter than target; its click error is magnified' })
  }
  if (input.plane === 'off' && (input.angleDeg == null || Number.isNaN(input.angleDeg))) {
    warnings.push({ level: 'amber', text: 'nearer objects read large, farther read small; not corrected' })
    warnings.push({ level: 'amber', text: 'error bar excludes depth/turn' })
  } else if (input.plane == null && input.metres != null && input.angleDeg == null) {
    warnings.push({ level: 'note', text: 'plane tag not set' })
  }
  if (input.angleDeg == null) {
    warnings.push({ level: 'note', text: 'Angle not set. Length is uncorrected.' })
  }
  warnings.push({ level: 'note', text: 'Lens distortion is not included.' })
  if (rel > 0.07) warnings.push({ level: 'red', text: 'uncertainty above 7%' })
  else if (rel > 0.05) warnings.push({ level: 'amber', text: 'uncertainty above 5%' })

  const tone: BarTone =
    rel > 0.07 ? 'red' : input.plane === 'off' || rel > 0.05 || warnings.some((w) => w.level === 'amber') ? 'amber' : 'ok'

  return {
    rel,
    sigmaM: input.metres == null ? null : Math.abs(input.metres) * rel,
    terms,
    warnings,
    tone,
  }
}
