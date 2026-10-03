import { publicUrl } from './publicUrl'

export type SamplePlate = {
  id: string
  name: string
  src: string
  blurb: string
  hint: string
  tag: string
  width: number
  height: number
}

export const SAMPLES: SamplePlate[] = [
  {
    id: 'calibration',
    name: 'Calibration',
    src: publicUrl('samples/calibration.svg'),
    blurb: 'Declared bars. Main field 4 px/m, near field 40 px/m.',
    hint: 'Lock one labelled bar, then check the rest against the legend.',
    tag: 'Scale',
    width: 1920,
    height: 1080,
  },
  {
    id: 'qv',
    name: 'Queen Victoria',
    src: publicUrl('samples/queen-victoria.svg'),
    blurb: 'Cunard liner, 294 m. 4 px per metre.',
    hint: 'Lock length 294 m. Beam should read 32.3 m.',
    tag: 'Cruise',
    width: 1920,
    height: 1080,
  },
  {
    id: 'ocisly',
    name: 'Of Course I Still Love You',
    src: publicUrl('samples/ocisly.svg'),
    blurb: 'SpaceX ASDS, 91 × 52 m. Falcon 9 on the pad.',
    hint: 'Lock barge length 91 m. Falcon 9 diameter should read 3.7 m.',
    tag: 'ASDS',
    width: 1920,
    height: 1080,
  },
  {
    id: 'tug',
    name: 'Harbor tug',
    src: publicUrl('samples/harbor-tug.svg'),
    blurb: 'Damen RSD 2513, 24.73 m. 24 px per metre.',
    hint: 'Lock length 24.73 m. Beam should read 13.13 m.',
    tag: 'Tug',
    width: 1920,
    height: 1080,
  },
  {
    id: 'falcon9',
    name: 'Falcon 9',
    src: publicUrl('samples/falcon-9.svg'),
    blurb: 'Block 5 stack, 70 m. 12 px per metre.',
    hint: 'Lock height 70 m. Diameter should read 3.7 m. Use cylinder rails on the first stage.',
    tag: 'Rocket',
    width: 1920,
    height: 1080,
  },
  {
    id: 'neopanamax',
    name: 'Neo-Panamax',
    src: publicUrl('samples/neopanamax.svg'),
    blurb: 'Canal-max boxship, 366 m. 4 px per metre.',
    hint: 'Lock length 366 m. An ISO 40ft box should read 12.192 m.',
    tag: 'Container',
    width: 1920,
    height: 1080,
  },
  {
    id: 'elevation',
    name: 'Vanguard · starboard',
    src: publicUrl('samples/vanguard-elevation.svg'),
    blurb: 'Ship on deck, 4 px per metre.',
    hint: 'Lock BOKA Vanguard length (275 m). Starship diameter should read 9 m.',
    tag: 'Heavy lift',
    width: 1920,
    height: 1080,
  },
  {
    id: 'plan',
    name: 'Vanguard · plan',
    src: publicUrl('samples/vanguard-plan.svg'),
    blurb: 'Deck 275 × 70 m, overall beam 78.75 m.',
    hint: 'Lock deck beam (70 m). The hull outline is 78.75 m across.',
    tag: 'Heavy lift',
    width: 1920,
    height: 1080,
  },
]
