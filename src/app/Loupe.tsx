import { useEffect, useRef } from 'react'
import type { Point } from '../math'

export function Loupe({
  image,
  point,
  zoom,
  viewScale,
  anchor,
}: {
  image: HTMLImageElement | null
  point: Point | null
  zoom: number
  viewScale: number
  anchor: { x: number; y: number } | null
}) {
  const ref = useRef<HTMLCanvasElement>(null)
  const size = 120

  useEffect(() => {
    const canvas = ref.current
    if (!canvas || !image || !point || !image.naturalWidth) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = Math.round(size * dpr)
    canvas.height = Math.round(size * dpr)
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    const src = size / Math.max(zoom * Math.max(viewScale, 1e-6), 1e-6)
    ctx.fillStyle = '#1c1b19'
    ctx.beginPath()
    ctx.arc(size / 2, size / 2, size / 2 - 1, 0, Math.PI * 2)
    ctx.clip()
    ctx.fillRect(0, 0, size, size)
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(image, point.x - src / 2, point.y - src / 2, src, src, 0, 0, size, size)
    ctx.beginPath()
    ctx.arc(size / 2, size / 2, size / 2 - 1.5, 0, Math.PI * 2)
    ctx.strokeStyle = '#e8e2d6'
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.strokeStyle = '#ff4f00'
    ctx.lineWidth = 1.2
    ctx.beginPath()
    ctx.arc(size / 2, size / 2, size / 2 - 3.2, 0, Math.PI * 2)
    ctx.stroke()
    ctx.strokeStyle = '#e8e2d6'
    ctx.beginPath()
    ctx.moveTo(size / 2 - 16, size / 2)
    ctx.lineTo(size / 2 + 16, size / 2)
    ctx.moveTo(size / 2, size / 2 - 16)
    ctx.lineTo(size / 2, size / 2 + 16)
    ctx.stroke()
  }, [image, point, zoom, viewScale])

  if (!point || !anchor) return null
  return (
    <canvas
      ref={ref}
      className="loupe"
      style={{ left: anchor.x + 28, top: anchor.y - size - 16 }}
      aria-hidden="true"
    />
  )
}
