import type { Point } from '../math'

export type View = { x: number; y: number; scale: number }

export function clientToImage(
  clientX: number,
  clientY: number,
  origin: { left: number; top: number },
  view: View,
): Point {
  return {
    x: (clientX - origin.left - view.x) / view.scale,
    y: (clientY - origin.top - view.y) / view.scale,
  }
}

export function imageToClient(point: Point, origin: { left: number; top: number }, view: View) {
  return {
    x: origin.left + view.x + point.x * view.scale,
    y: origin.top + view.y + point.y * view.scale,
  }
}

/**
 * The page stylesheet caps every image at the stage width. The plate has to opt out,
 * or the photograph shrinks and the overlay stays on the full plate.
 */
export const plateImageStyle = {
  width: '100%',
  height: '100%',
  maxWidth: 'none',
} as const

/** A click on the image element's rendered box, which already includes pan and zoom. */
export function clientToImageBox(
  clientX: number,
  clientY: number,
  box: { left: number; top: number; width: number; height: number },
  imageWidth: number,
  imageHeight: number,
): Point {
  return {
    x: ((clientX - box.left) / box.width) * imageWidth,
    y: ((clientY - box.top) / box.height) * imageHeight,
  }
}
