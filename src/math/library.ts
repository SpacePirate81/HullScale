import { DECISIONS } from './decisions'

export type LibraryKind = 'length' | 'width' | 'height' | 'diameter'

export type LibraryEntry = {
  id: string
  name: string
  metres: number
  kind: LibraryKind
  group: string
}

/**
 * Named lengths a lock can use. Metres only.
 * Starship's length follows DECISIONS.starshipLengthM (50.3 m, the plates).
 * 52 m is kept on DECISIONS.starshipLengthAlternativeM and is not an entry.
 */
export const REFERENCE_LIBRARY: LibraryEntry[] = [
  { id: 'starship-d', name: 'Starship diameter', metres: 9, kind: 'diameter', group: 'Vehicles' },
  { id: 'starship-l', name: 'Starship (Ship) length', metres: DECISIONS.starshipLengthM, kind: 'length', group: 'Vehicles' },
  { id: 'starship-v3-stack', name: 'Starship V3 stack', metres: 124.4, kind: 'length', group: 'Vehicles' },
  { id: 'superheavy-l', name: 'Super Heavy length', metres: 72.3, kind: 'length', group: 'Vehicles' },
  { id: 'falcon-d', name: 'Falcon 9 diameter', metres: 3.7, kind: 'diameter', group: 'Vehicles' },
  { id: 'falcon-h', name: 'Falcon 9 height', metres: 70, kind: 'height', group: 'Vehicles' },
  { id: 'falcon-s1', name: 'Falcon 9 first stage', metres: 47.7, kind: 'height', group: 'Vehicles' },
  { id: 'falcon-fairing-d', name: 'Falcon 9 fairing diameter', metres: 5.2, kind: 'diameter', group: 'Vehicles' },
  { id: 'falcon-fairing-h', name: 'Falcon 9 fairing height', metres: 13.1, kind: 'height', group: 'Vehicles' },
  { id: 'falcon-legs', name: 'Falcon 9 landing-leg span', metres: 18, kind: 'width', group: 'Vehicles' },
  { id: 'dragon-d', name: 'Crew Dragon diameter', metres: 4, kind: 'diameter', group: 'Vehicles' },
  { id: 'dragon-h', name: 'Crew Dragon height (with trunk)', metres: 8.1, kind: 'height', group: 'Vehicles' },
  { id: 'newglenn-d', name: 'New Glenn diameter', metres: 7, kind: 'diameter', group: 'Vehicles' },
  { id: 'newglenn-h', name: 'New Glenn height', metres: 98, kind: 'height', group: 'Vehicles' },
  { id: 'sls-d', name: 'SLS core diameter', metres: 8.4, kind: 'diameter', group: 'Vehicles' },
  { id: 'sls-h', name: 'SLS Block 1 height', metres: 98, kind: 'height', group: 'Vehicles' },
  { id: 'iso20-l', name: 'ISO 20ft length', metres: 6.058, kind: 'length', group: 'ISO boxes' },
  { id: 'iso20-w', name: 'ISO 20ft width', metres: 2.438, kind: 'width', group: 'ISO boxes' },
  { id: 'iso20-h', name: 'ISO 20ft height', metres: 2.591, kind: 'height', group: 'ISO boxes' },
  { id: 'iso40-l', name: 'ISO 40ft length', metres: 12.192, kind: 'length', group: 'ISO boxes' },
  { id: 'iso40-w', name: 'ISO 40ft width', metres: 2.438, kind: 'width', group: 'ISO boxes' },
  { id: 'hopper-l', name: 'Hopper barge length', metres: 60, kind: 'length', group: 'Vessels' },
  { id: 'hopper-b', name: 'Hopper barge beam', metres: 11.4, kind: 'width', group: 'Vessels' },
  { id: 'boka-l', name: 'BOKA Vanguard length', metres: 275, kind: 'length', group: 'BOKA Vanguard' },
  { id: 'boka-beam', name: 'BOKA Vanguard deck beam', metres: 70, kind: 'width', group: 'BOKA Vanguard' },
  { id: 'boka-oa', name: 'BOKA Vanguard overall beam', metres: 78.75, kind: 'width', group: 'BOKA Vanguard' },
  { id: 'boka-d', name: 'BOKA Vanguard depth', metres: 15.5, kind: 'height', group: 'BOKA Vanguard' },
  { id: 'person', name: 'Person', metres: 1.75, kind: 'height', group: 'Everyday' },
  { id: 'car', name: 'Car length', metres: 4.5, kind: 'length', group: 'Everyday' },
  { id: 'qv-l', name: 'Queen Victoria length', metres: 294, kind: 'length', group: 'Queen Victoria' },
  { id: 'qv-beam', name: 'Queen Victoria beam', metres: 32.3, kind: 'width', group: 'Queen Victoria' },
  { id: 'qv-extreme', name: 'Queen Victoria extreme beam', metres: 36.6, kind: 'width', group: 'Queen Victoria' },
  { id: 'qv-draft', name: 'Queen Victoria draft', metres: 8, kind: 'height', group: 'Queen Victoria' },
  { id: 'qv-funnel', name: 'Queen Victoria keel to funnel', metres: 62.5, kind: 'height', group: 'Queen Victoria' },
  { id: 'ocisly-l', name: 'OCISLY length', metres: 91, kind: 'length', group: 'ASDS' },
  { id: 'ocisly-b', name: 'OCISLY beam', metres: 52, kind: 'width', group: 'ASDS' },
  { id: 'tug-l', name: 'Harbor tug length', metres: 24.73, kind: 'length', group: 'Harbor tug' },
  { id: 'tug-b', name: 'Harbor tug beam', metres: 13.13, kind: 'width', group: 'Harbor tug' },
  { id: 'tug-d', name: 'Harbor tug draft', metres: 6.5, kind: 'height', group: 'Harbor tug' },
  { id: 'neopanamax-l', name: 'Neo-Panamax length', metres: 366, kind: 'length', group: 'Container' },
  { id: 'neopanamax-b', name: 'Neo-Panamax beam', metres: 51.25, kind: 'width', group: 'Container' },
  { id: 'neopanamax-d', name: 'Neo-Panamax draft', metres: 15.2, kind: 'height', group: 'Container' },
  { id: 'neopanamax-air', name: 'Neo-Panamax air draft', metres: 57.91, kind: 'height', group: 'Container' },
]

export function libraryById(id: string): LibraryEntry | undefined {
  return REFERENCE_LIBRARY.find((entry) => entry.id === id)
}

export function libraryGroups(): string[] {
  const seen: string[] = []
  for (const entry of REFERENCE_LIBRARY) {
    if (!seen.includes(entry.group)) seen.push(entry.group)
  }
  return seen
}
