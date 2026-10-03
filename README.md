# HullScale

Live build snapshot (v0.9.4).

This repository is a snapshot of the **compiled, publicly served build** of HullScale
(https://hullscale.grok.me), captured on **2026-10-03**.

- HullScale is a photo-scale measuring instrument: lock a known length on a photograph and read
  every other distance, projected area, and lower-bound volume.
- The original source lives in Grok's app builder (project id `01a06f0e-717c-7042-8ef4-e9c0083c0b1e`).
  Only the built output is public, so that is what is captured here — minified bundles, not source.
- Purpose: a fixed baseline for the upcoming rebuild that adds a physics/trigonometry math engine.

## Files

| Path | Notes |
|---|---|
| `index.html` | Page as served (contains one stray NUL byte near offset ~25534, kept as served) |
| `assets/index-BF-JdMXQ.js` | Main entry bundle |
| `assets/routes-UU2gzzmt.js` | Route chunk (dynamically imported by the entry bundle) |
| `assets/styles-qkEIF6j4.css` | Stylesheet |
| `samples/*.svg` | calibration, queen-victoria, ocisly, harbor-tug, falcon-9, neopanamax, vanguard-elevation, vanguard-plan |
| `favicon.svg`, `manifest.webmanifest` | App icon and PWA manifest |
| `icon-192.png`, `icon-512.png`, `og.jpg` | Binary images |

Not captured: `/__grok/*` platform files, `https://grok.com/grok-app-builder/extensions.js`,
and Google Fonts (IBM Plex Mono / Sans / Sans Condensed) loaded from fonts.googleapis.com — these
are external/platform resources, not part of the app.
