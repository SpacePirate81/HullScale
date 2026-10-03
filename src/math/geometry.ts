export type Point = { x: number; y: number }

export function distance(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y)
}

export function midpoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
}

export function lerp(a: Point, b: Point, t: number): Point {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }
}

/** Signed area via the shoelace sum. Absolute value is the polygon area in px². */
export function shoelace(points: Point[]): number {
  if (points.length < 3) return 0
  let sum = 0
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length
    sum += points[i].x * points[j].y - points[j].x * points[i].y
  }
  return Math.abs(sum) / 2
}

export function centroid(points: Point[]): Point {
  if (points.length === 0) return { x: 0, y: 0 }
  if (points.length < 3) {
    const s = points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 })
    return { x: s.x / points.length, y: s.y / points.length }
  }
  let twice = 0
  let cx = 0
  let cy = 0
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length
    const cross = points[i].x * points[j].y - points[j].x * points[i].y
    twice += cross
    cx += (points[i].x + points[j].x) * cross
    cy += (points[i].y + points[j].y) * cross
  }
  const area = twice / 2
  if (Math.abs(area) < 1e-9) {
    const s = points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 })
    return { x: s.x / points.length, y: s.y / points.length }
  }
  return { x: cx / (6 * area), y: cy / (6 * area) }
}

export function boundingBox(points: Point[]): { w: number; h: number } {
  const xs = points.map((p) => p.x)
  const ys = points.map((p) => p.y)
  return { w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) }
}

/** Perpendicular distance from a point to the infinite line through a and b. */
export function lineDistance(point: Point, a: Point, b: Point): number {
  const len = distance(a, b)
  if (len < 1e-9) return distance(point, a)
  return Math.abs((point.x - a.x) * (b.y - a.y) - (point.y - a.y) * (b.x - a.x)) / len
}
