# HullScale math engine plan

This is a plan only. It does not change the app. It describes what the compiled v0.9.4 build actually calculates, and how a small math module should rebuild that behaviour and add the missing trigonometry.

The measuring rules live in `assets/routes-UU2gzzmt.js`. The other bundle, `assets/index-BF-JdMXQ.js`, is the React app shell. The eight drawings in `samples/` are the check plates: each one states its scale in metres per pixel.

---

## 1. How HullScale measures today

You open a photograph or a to-scale plate. Until you lock a known length, every line is only a pixel count.

**Locking a length.** You draw a line across something whose real size you already know (the ship's length, an ISO container, a person). You assign that size from the built-in library, or you type it. The app divides known metres by the pixel length of that line. That ratio is the scale: how many metres one pixel stands for. Every other line is then pixel length times that scale.

**More than one lock.** Each locked line contributes its own metres-per-pixel, taken at the middle of the line. With no horizon drawn, the app uses the plain average. If two locks disagree by more than 8 percent, it warns you to check the assigned lengths, or to add a horizon if the photo's scale changes with depth.

**Units.** The internal number is always metres. The screen can show metres, feet, kilometres, or miles. Feet use 0.3048 m, kilometres 1000 m, miles 1609.344 m. The second figure beside a length is the other of metres and feet (kilometres still pairs with feet, miles with metres). Areas show square metres, or square feet when the length unit is feet or miles. Volumes show cubic metres, or cubic feet in those same cases. There is no square-kilometre or cubic-mile display.

**Distances.** A measure is a straight line between two points. Its length is the ordinary straight-line pixel distance, converted with the scale at points along the line (eight equal steps). A diagonal on a flat drawing is handled by that straight-line distance. Nothing yet corrects for a line that is turned away from the camera.

**Horizon and waterline.** You can draw one horizon and one waterline. If a horizon exists, scale at a point is the locked scale multiplied by how far that point sits from the horizon, divided by how far the lock sits from the horizon. If there is no horizon, the waterline is used the same way. In a real photograph, objects closer to the camera sit farther from the horizon and should cover more pixels per metre. The compiled formula runs the opposite way. The rebuild should not copy that direction; see the open questions.

**Area.** You draw a closed outline on one face of a structure and tag it front, side, or top. The pixel area is the usual polygon area (the "shoelace" sum). Square metres are that pixel area times the scale at the outline's centre, squared. The app calls this projected area: the face as it appears in the photo, not the true surface of a turned hull.

**Lower-bound prism volume.** For one structure, the app looks at the front, side, and top outlines. It takes the width and height of the box around each outline, converts those with the local scale, and treats them as the three directions of a rectangular box. When two faces supply the same direction, it keeps the smaller number. It needs at least two faces, and all three directions, before it shows a volume. The number is width times height times depth. The on-screen note says this is the box those faces support, not the true hull volume.

**Starship stays a cylinder, not a cone.** The cylinder tool is two rails along a body, such as a rocket stage. You can assign a known diameter. The app then walks along the rails and, at each short step, converts pixels to metres with that known diameter and the local pixel width. A taper on the photo is treated as perspective (the body is still the same diameter), and the length comes out of that walk. The volume that belongs to this model is the cylinder volume, pi times radius squared times that length. A cone would use one third of that, and the app does not. The cylinder volume is calculated in the bundle and is not shown on screen; only the length is.

If you do not assign a diameter, the cylinder's length is just its centre-line pixel length times the ordinary scale at its middle.

**Reference library.** Forty-one named lengths, stored in metres. You can also add your own. The groups are Vehicles, ISO boxes, Vessels, BOKA Vanguard, Everyday, Queen Victoria, ASDS, Harbor tug, and Container. Examples the plates use: Queen Victoria 294 m, Falcon 9 height 70 m and diameter 3.7 m, harbor tug 24.73 m, BOKA Vanguard 275 m and deck beam 70 m, Starship diameter 9 m, ISO 40 ft length 12.192 m, person 1.75 m. One mismatch to resolve: the Vanguard and calibration plates draw Starship 50.3 m long, while the library entry "Starship (Ship) length" is 52 m.

**Error bar already in the app.** For a measure, the app estimates a percentage from three shares, combined by the hypotenuse (the square root of the sum of squares), then adds any extra bias shares:

- how many pixels of doubt are in the two ends you clicked, divided by the line length
- the same kind of doubt in the locked reference line
- the tolerance you typed for the known length, divided by that length

Default click doubt, in pixels: finger 4 (clean edge) or 7 (soft edge); stylus 2 or 4; loupe 1 or 3. A line under 150 pixels is flagged as too short for a ±5 percent reading. Above 5 percent the bar is amber; above 7 percent it is red. If you mark the measure as off the same plane as the scale, the app does not correct it. It only warns that nearer objects read large and farther ones read small, and the bar says plane, turn, and lens are not included. A typed reference tolerance of zero adds a note and does not widen the bar.

**Other tools, outside the measuring formulas.** Identify ranks up to five hulls from a separate ship list using proportions, funnel and crane counts, era, and place. It is a match score, not a measurement. Waterline assist guesses a line from the picture and asks you to drag the ends. Claims pin a stated length next to a measure. None of these are the math engine.

---

## 2. What the math engine should cover

The engine is pure calculation: points, metres, and angles in, numbers and an error bar out. No drawing code inside it. Each formula below is the one the rebuild should use. Where v0.9.4 already does this, it says so.

### Scale lock (already in v0.9.4)

```
pixel length = square root of ( (x2 − x1)² + (y2 − y1)² )
metres per pixel = known metres ÷ pixel length
```

One line: the known length tells the app how big one pixel is.

### Units (already in v0.9.4)

```
shown value = metres ÷ metres in that unit
metres in the unit:  m = 1,   ft = 0.3048,   km = 1000,   mi = 1609.344
square feet = square metres ÷ 0.09290304
cubic feet  = cubic metres  ÷ 0.028316846592
```

One line: every calculation stays in metres; the unit button only changes the label.

### Straight length on one plane (already in v0.9.4)

```
metres = pixel length × metres per pixel
```

With a horizon, split the line into short steps (eight today) and use the local scale at the middle of each step, then add the steps.

One line: on a flat plate, pixel length times scale is the real length, including diagonals.

### Perspective, from a horizon (replace the v0.9.4 direction)

```
metres per pixel here
  = metres per pixel at the lock
    × (lock's distance from the horizon ÷ this point's distance from the horizon)
```

Distance means the perpendicular distance from the point to the horizon line. A point sitting on the horizon is clamped so the scale cannot explode.

One line: closer to the camera means farther from the horizon, so more pixels per metre.

The waterline should not drive this unless you explicitly say it is the horizon. On a side-on ship the waterline is the bottom of the hull, not the vanishing line.

### Foreshortening and camera tilt (new)

Angle zero means "square on", in the same plane as the locked scale.

```
true length = length on the photo ÷ cos(angle out of that plane)
```

Split by what was turned:

```
along the ship, ship yawed by angle α from square-on:
  true length = photo length ÷ cos(α)

vertical on the ship, camera pitched by angle β from square-on:
  true length = photo length ÷ cos(β)
```

If you know the flat run and the rise instead of an angle:

```
true length = square root of ( run² + rise² )
```

One line: a length turned away from the camera looks short; dividing by the cosine of that turn restores it.

If you leave the angle unset, the engine reports the uncorrected length and keeps today's warning. It does not invent an angle.

### Projected area (already in v0.9.4) and a turned face (new)

```
pixel area = 1/2 × absolute value of the sum of ( xi × y{i+1} − x{i+1} × yi )
projected square metres = pixel area × (metres per pixel at the centre)²
```

When the face is turned by an angle θ from facing the camera:

```
true area = projected area ÷ cos(θ)
```

One line: the outline gives the area as seen; the cosine restores a face that is swung away.

### Volume

Prism, already in v0.9.4. Width, height, and depth come from the boxes around the front, side, and top faces. The same direction from two faces keeps the smaller value.

```
prism volume = width × height × depth
```

One line: this is the rectangular box the drawn faces support, and it is a lower bound on a fuller hull only in that sense.

Cylinder, already calculated, not shown. Diameter D is the diameter you assigned. Length is the sum of the rail steps described in section 1.

```
cylinder volume = π × (D ÷ 2)² × length
```

One line: Starship and Falcon stay a tube of constant diameter; a pinch in the photo is perspective, not a cone.

Cone, only if you explicitly choose a cone. Never applied to a cylinder.

```
cone volume = (1/3) × π × (D ÷ 2)² × length
```

Frustum, only if you explicitly say both end diameters are real (a nose, not a perspective taper):

```
frustum volume = (1/3) × π × length × ( R² + R × r + r² )
```

One line: a cone is one third of the cylinder; a frustum is the tube that really does change diameter.

### Uncertainty (keep today's bar, then add angle)

```
click share     = hypotenuse(doubt at end 1, doubt at end 2) ÷ pixel length
ref-click share = the same for the locked line
ref-length share = tolerance in metres ÷ known metres
angle share     = absolute value of tan(angle) × angle doubt in radians

total share = hypotenuse(click, ref-click, ref-length, angle) + extra bias shares
error bar   = measured metres × total share
```

Click doubt stays: finger 4 or 7 px, stylus 2 or 4 px, loupe 1 or 3 px. Keep the 150-pixel caution and the 5 percent and 7 percent colours. Lens distortion stays a named gap until you ask for it; the bar should say so in words rather than hiding it inside the number.

One line: the bar is how far the reading can move if the clicks, the known length, or the angle are a bit off.

---

## 3. How this fits the rebuilt app

The math module does not know about buttons, files, or the screen. The screen asks it questions ("these two points, this lock, this angle") and draws whatever comes back. That split is what makes the plate checks possible before any interface exists.

Proposed layout, kept small on purpose:

```
docs/MATH_ENGINE_PLAN.md     this plan
samples/                     the eight plates, unchanged, used as test data
src/math/
  library.ts                 the named reference lengths
  units.ts                   m, ft, km, mi and the square and cubic conversions
  geometry.ts                pixel distance, polygon area, distance to a line
  scale.ts                   lock, average of locks, horizon transfer
  length.ts                  straight length, rise-and-run, yaw and pitch
  area.ts                    projected area and a turned face
  volume.ts                  prism, cylinder, and the explicit cone and frustum
  uncertainty.ts             the error bar
  index.ts                   the public door to the module
src/math/math.test.ts        the plate checks and the angle checks
src/app/                     screens, added only after the module's tests pass
  main.tsx
  PlateView.tsx              photo or sample, pan and zoom
  Toolbar.tsx                the tools you already have
  Readout.tsx                length, area, volume, error bar
```

The compiled site can stay at the repo root until the new app replaces it. Nothing in `src/math` imports from `src/app`.

Identify, waterline guessing, and claims stay out of `src/math`. They can return later as their own pieces if you want them in this rebuild.

---

## 4. Build order

Each step is done when its checks pass. Steps 1–10 are the math module only. The screens start at step 11, after the numbers are already trustworthy.

The sample plates are orthographic drawings: one scale everywhere, no perspective. They prove the flat measuring. Perspective and tilt get their own made-up numbers, so a plate check cannot accidentally "pass" a wrong horizon formula.

**1. Units.** Convert a few exact values both ways: 294 m is 294 ÷ 0.3048 feet, 1 km is 1000 m, 1 mile is 1609.344 m. Check square feet and cubic feet with the factors in section 2.

**2. Pixel distance and the scale lock.** Queen Victoria is 4 px/m, so 294 m is 1176 px. Locking those 1176 px must return exactly 4 px/m. Falcon 9 is 12 px/m (70 m is 840 px). The harbor tug is 24 px/m (24.73 m is 593.52 px).

**3. Reference library.** Loading a library name must return the metres in section 1. A check fails if Starship's length entry and the Vanguard plates still disagree, until you pick one number (question 1).

**4. Other lengths on the same plate.** After the lock in step 2, these must read back:

| Plate | Also check |
|---|---|
| Queen Victoria, 4 px/m | beam 32.3 m (129.2 px), extreme beam 36.6 m (146.4 px), draft 8 m (32 px), keel to funnel 62.5 m (250 px) |
| Falcon 9, 12 px/m | diameter 3.7 m (44.4 px), fairing diameter 5.2 m (62.4 px), fairing height 13.1 m (157.2 px), first stage 47.7 m (572.4 px) |
| Harbor tug, 24 px/m | beam 13.13 m (315.12 px), draft 6.50 m (156 px), person 1.75 m (42 px) |
| Neo-Panamax, 4 px/m | length 366 m (1464 px), beam 51.25 m (205 px), draft 15.2 m (60.8 px), ISO 40 ft length 12.192 m (48.768 px) |
| OCISLY, 10 px/m | 91 by 52 m (910 by 520 px), Falcon 9 diameter 3.7 m (37 px), leg span 18 m (180 px) |
| Vanguard elevation, 4 px/m | length 275 m (1100 px), depth 15.5 m (62 px), Starship diameter 9 m (36 px) |
| Vanguard plan, 4 px/m | deck 275 by 70 m, overall beam 78.75 m (315 px) |
| Calibration | main field 4 px/m, near field 40 px/m; each labelled bar matches its caption |

**5. Two locks.** Two equal scales average to the same scale. Two scales 10 percent apart raise the disagreement warning. Two scales 5 percent apart do not.

**6. Area.** A rectangle of 48.768 by 9.752 px on the Neo-Panamax plate (the ISO 40 ft length by the 2.438 m width, at 4 px/m) has a projected area of 12.192 × 2.438 square metres. A turned face at 60 degrees is twice that, because cos(60°) is 1/2.

**7. Prism.** A front face 10 m wide and 4 m high plus a side face 20 m long and 4 m high gives 800 cubic metres. A third face that says the width is only 9 m changes the result to 720, because the smaller width wins. One face alone returns no volume.

**8. Cylinder, and not a cone.** Parallel Falcon 9 rails, 44.4 px apart and 840 px long, with diameter 3.7 m, return length 70 m and volume π × (1.85)² × 70. Rails that narrow toward one end, with the same assigned diameter, still return a length from the constant diameter, and the volume stays the cylinder volume. The cone formula is a separate call and must not be used by the cylinder path.

**9. Horizon direction.** Put a lock 100 px from the horizon. A point 200 px from the horizon (closer to the camera) must get half the metres per pixel, meaning twice the pixels per metre. This is the check that stops the v0.9.4 reversal from coming back. A waterline mark alone must not change the scale.

**10. Angles and the error bar.** A 3-4-5 triangle returns 5. A length at 60 degrees out of plane is twice the photo length. Yaw 0 and pitch 0 leave the plate readings from step 4 unchanged. A finger-click bar on the 1176 px Queen Victoria length is under 1 percent. The same finger on the tug's 42 px person is over 7 percent and also trips the 150-pixel caution. An angle doubt widens the bar by the tangent term and does not move the central reading.

**11. First screen.** Open a sample plate, draw one line, lock a library length, read metres and feet. Check Queen Victoria's beam by hand against the table in step 4.

**12. The rest of the measuring tools, one at a time.** Area, cylinder rails, horizon, unit switch, and the error-bar readout. Each one is checked on a single plate from the table before the next tool is added. Export of a reading can follow the readout; it is the same numbers, written down.

---

## 5. Open questions

1. Starship length: the plates use 50.3 m and the library says 52 m. Which number should a lock use?
2. Is this rebuild the measuring tools only, or does it also keep Identify and the waterline guesser?
3. For a length turned out of the photo, will you type the angle, or should the app leave the length uncorrected and only widen the error bar?
4. Should a drawn waterline ever change the scale, or only a line you mark as the horizon?
5. The cylinder volume is already calculated and not shown. Should the readout show it?
6. Neo-Panamax air draft on the plate is 57.91 m and is not in the library. ISO 40 ft in the library is the length only; the plates also use the 2.438 m width. Add those entries?
