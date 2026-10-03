# HullScale

HullScale is a photo-scale measuring instrument: lock a known length on a photograph and read
every other distance, projected area, and an upper-bound box around the drawn faces.

The running app is version 2.0.1, a Vite + React + TypeScript rebuild. The math lives in `src/math` and does not
import the screens. Decisions that the owner can change later (Starship length 50.3 m, horizon-only
scale, optional angle, cylinder volume on the readout) are in `src/math/decisions.ts`.

## Run, test, and build

```bash
npm install
npm test          # math engine checks, including the sample-plate scales
npm run dev       # http://localhost:5173/HullScale/
npm run build     # static site in dist/, paths rooted at /HullScale/
npm run preview   # serve that site locally, also under /HullScale/
```

`dist/` is the deployable site: `index.html`, hashed assets, the eight plates, icons, and the
PWA manifest. A small service worker is registered so a phone can install it. Asset, plate,
manifest, and service-worker URLs use the `/HullScale/` prefix so the site works at
https://spacepirate81.github.io/HullScale/.

## Publish

A push to `main` runs `.github/workflows/pages.yml`. That workflow builds the app and deploys
`dist/` to GitHub Pages with the official Pages actions.

The workflow cannot turn Pages on. In the repo on GitHub, open Settings, then Pages, then under
Build and deployment set Source to GitHub Actions. After this branch is merged to `main`, that
push publishes the site.

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
