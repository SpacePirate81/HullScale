import { describe, expect, it } from 'vitest'
import manifest from '../../manifest.webmanifest?raw'
import { SAMPLES } from './samples'
import { publicUrl } from './publicUrl'

describe('GitHub Pages base path', () => {
  it('prefixes public files with /HullScale/', () => {
    expect(import.meta.env.BASE_URL).toBe('/HullScale/')
    expect(publicUrl('samples/queen-victoria.svg')).toBe('/HullScale/samples/queen-victoria.svg')
    expect(publicUrl('/sw.js')).toBe('/HullScale/sw.js')
  })

  it('loads every sample plate from that prefix', () => {
    for (const sample of SAMPLES) {
      expect(sample.src.startsWith('/HullScale/samples/')).toBe(true)
      expect(sample.src.endsWith('.svg')).toBe(true)
    }
  })

  it('scopes the installable app to the project path', () => {
    const parsed = JSON.parse(manifest) as {
      id: string
      start_url: string
      scope: string
      icons: { src: string }[]
    }
    expect(parsed.id).toBe('/HullScale/')
    expect(parsed.start_url).toBe('/HullScale/')
    expect(parsed.scope).toBe('/HullScale/')
    expect(parsed.icons.map((icon) => icon.src)).toEqual(['/HullScale/icon-192.png', '/HullScale/icon-512.png'])
  })
})
