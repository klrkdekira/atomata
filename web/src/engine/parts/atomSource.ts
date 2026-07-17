import { axialKey } from '../hex'
import type { PartSpec } from '../schema'
import type { AtomState, SimState } from '../types'

export function runAtomSources(parts: readonly PartSpec[], state: SimState): SimState {
  const occupied = new Set(state.atoms.map((atom) => axialKey(atom.cell)))
  const sources = parts
    .filter((part): part is Extract<PartSpec, { kind: 'atomSource' }> => part.kind === 'atomSource')
    .slice()
    .sort((a, b) => a.cell.q - b.cell.q || a.cell.r - b.cell.r)

  let nextAtomId = state.nextAtomId
  let spawnedCount = state.spawnedCount
  const spawned: AtomState[] = []

  for (const source of sources) {
    const key = axialKey(source.cell)
    if (occupied.has(key)) continue
    spawned.push({ id: nextAtomId, element: source.element, cell: source.cell, charge: 0 })
    occupied.add(key)
    nextAtomId += 1
    spawnedCount += 1
  }

  if (spawned.length === 0) return state
  return {
    ...state,
    atoms: [...state.atoms, ...spawned].sort((a, b) => a.id - b.id),
    nextAtomId,
    spawnedCount,
  }
}
