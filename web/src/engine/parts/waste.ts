import { axialEq } from '../hex'
import { deriveMolecules, moleculeContaining } from '../molecule'
import type { PartSpec } from '../schema'
import type { SimState } from '../types'

export function runWaste(parts: readonly PartSpec[], state: SimState): SimState {
  const wasteTiles = parts
    .filter((part): part is Extract<PartSpec, { kind: 'waste' }> => part.kind === 'waste')
    .slice()
    .sort((a, b) => a.cell.q - b.cell.q || a.cell.r - b.cell.r)
  if (wasteTiles.length === 0) return state

  let atoms = state.atoms
  let bonds = state.bonds
  let wasteCount = state.wasteCount

  for (const tile of wasteTiles) {
    const atomHere = atoms.find((atom) => axialEq(atom.cell, tile.cell))
    if (!atomHere) continue

    const molecules = deriveMolecules(atoms, bonds)
    const component = moleculeContaining(molecules, atomHere.id)
    const removedIds = new Set(component?.atomIds ?? [atomHere.id])

    atoms = atoms.filter((atom) => !removedIds.has(atom.id))
    bonds = bonds.filter((bond) => !removedIds.has(bond.a) && !removedIds.has(bond.b))
    wasteCount += removedIds.size
  }

  return { ...state, atoms, bonds, wasteCount }
}
