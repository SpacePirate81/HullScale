# HullScale

HullScale is a photo-scale measuring instrument: lock a known length on a photograph and read
every other distance, projected area, and lower-bound volume.

The running app is a Vite + React + TypeScript rebuild. The math lives in `src/math` and does not
import the screens. Decisions that the owner can change later (Starship length 50.3 m, horizon-only
scale, optional angle, cylinder volume on the readout) are in `src/math/decisions.ts`.

## Run, test, and build

```bash
npm install
npm test          # math engine checks, including the sample-plate scales
npm run dev       # http://localhost:5173
npm run build     # static site in dist/
npm run preview   # serve that site locally
```

`dist/` is the deployable site: `index.html`, hashed assets, the eight plates, icons, and the
PWA manifest. A small service worker is registered so a phone can install it.

## Snapshot of v0.9.4

The compiled site captured on 2026-10-03 is still in the repo. The original source lived in Grok's
app builder (project id `01a06f0e-717c-7042-8ef4-e9c0083c0b1e`); only that built output was public.

| Path | Notes |
|---|---|
| `snapshot/v0.9.4/index.html` | Page as served (stray NUL bytes kept) |
| `assets/index-BF-JdMXQ.js` | Main entry bundle |
| `assets/routes-UU2gzzmt.js` | Route chunk |
| `assets/styles-qkEIF6j4.css` | Stylesheet from that build |
| `samples/*.svg` | The eight plates, still used by the rebuild |

## Follow-ups

Identify (the silhouette ranker) and the automatic waterline guesser are not in this rebuild.
A waterline can still be drawn; it does not change the scale. Lens distortion is named on the
error bar and is not corrected.
