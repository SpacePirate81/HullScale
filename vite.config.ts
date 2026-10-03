import { cpSync, createReadStream, existsSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

const root = path.dirname(fileURLToPath(import.meta.url))
const siteBase = '/HullScale/'
const staticPaths = ['samples', 'favicon.svg', 'icon-192.png', 'icon-512.png', 'og.jpg', 'manifest.webmanifest']

const types: Record<string, string> = {
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webmanifest': 'application/manifest+json',
}

function repoStatic() {
  return {
    name: 'hullscale-repo-static',
    configureServer(server: { middlewares: { use: (fn: (req: { url?: string }, res: NodeJS.WritableStream & { setHeader: (k: string, v: string) => void; }, next: () => void) => void) => void } }) {
      server.middlewares.use((req, res, next) => {
        const url = decodeURIComponent((req.url ?? '').split('?')[0] ?? '')
        const withoutBase = url.startsWith(siteBase) ? url.slice(siteBase.length - 1) : url
        const rel = withoutBase.replace(/^\//, '')
        if (!rel || rel.includes('..')) return next()
        const allowed = staticPaths.some((item) => rel === item || rel.startsWith(`${item}/`))
        if (!allowed) return next()
        const file = path.join(root, rel)
        if (!existsSync(file) || statSync(file).isDirectory()) return next()
        res.setHeader('Content-Type', types[path.extname(file)] ?? 'application/octet-stream')
        createReadStream(file).pipe(res)
      })
    },
    closeBundle() {
      const out = path.resolve(root, 'dist')
      for (const item of staticPaths) {
        cpSync(path.join(root, item), path.join(out, item), { recursive: true })
      }
    },
  }
}

export default defineConfig({
  base: siteBase,
  plugins: [react(), repoStatic()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
