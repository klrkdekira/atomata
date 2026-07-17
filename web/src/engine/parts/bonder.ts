import { attemptBond } from '../../chem/adapter'
import type { GraphAtom, GraphBond } from '../../chem/adapter'
import { axialEq, axialNeighbor } from '../hex'
import type { Direction } from '../hex'
import { deriveMolecules, moleculeContaining } from '../molecule'
import type { PartSpec } from '../schema'
import { compareBond, makeBond } from '../types'
import type { BondState, SimState } from '../types'

function alreadyBonded(bonds: readonly BondState[], a: number, b: number): boolean {
  const bond = makeBond(a, b)
  return bonds.some((existing) => existing.a === bond.a && existing.b === bond.b)
}

// The generic Bonder tile: when two atoms sit on adjacent cells straddling the
// bonder (its own cell + a neighbor), attempt a bond. Validity — including
// whether the connection should be covalent or ionic — is delegated entirely
// to chem/adapter.ts#attemptBond so the chemistry rules live in one place.
export function runBonders(parts: readonly PartSpec[], state: SimState): SimState {
  const bonders = parts
    .filter((part): part is Extract<PartSpec, { kind: 'bonder' }> => part.kind === 'bonder')
    .slice()
    .sort((a, b) => a.cell.q - b.cell.q || a.cell.r - b.cell.r)
  if (bonders.length === 0) return state

  let atoms = state.atoms
  let bonds = state.bonds

  for (const bonder of bonders) {
    const centerAtom = atoms.find((atom) => axialEq(atom.cell, bonder.cell))
    if (!centerAtom) continue

    for (let dir = 0; dir < 6; dir++) {
      const neighborCell = axialNeighbor(bonder.cell, dir as Direction)
      const neighborAtom = atoms.find((atom) => axialEq(atom.cell, neighborCell))
      if (!neighborAtom) continue
      if (alreadyBonded(bonds, centerAtom.id, neighborAtom.id)) continue

      const molecules = deriveMolecules(atoms, bonds)
      const componentA = moleculeContaining(molecules, centerAtom.id)
      const componentB = moleculeContaining(molecules, neighborAtom.id)
      const atomIds = Array.from(
        new Set([...(componentA?.atomIds ?? [centerAtom.id]), ...(componentB?.atomIds ?? [neighborAtom.id])]),
      ).sort((a, b) => a - b)

      // Component size cap keeps subgraph validation cheap; in practice
      // playground molecules stay well under this.
      if (atomIds.length > 24) continue

      const indexOf = new Map(atomIds.map((id, index) => [id, index]))
      const graphAtoms: GraphAtom[] = atomIds.map((id) => {
        const atom = atoms.find((a) => a.id === id)!
        return { element: atom.element, charge: atom.charge }
      })
      const existingBonds: GraphBond[] = bonds
        .filter((bond) => indexOf.has(bond.a) && indexOf.has(bond.b))
        .map((bond) => [indexOf.get(bond.a)!, indexOf.get(bond.b)!])

      const aIndex = indexOf.get(centerAtom.id)!
      const bIndex = indexOf.get(neighborAtom.id)!
      const result = attemptBond(graphAtoms, existingBonds, aIndex, bIndex)
      if (!result.ok) continue

      atoms = atoms.map((atom) => {
        const index = indexOf.get(atom.id)
        if (index === undefined) return atom
        const updated = result.atoms[index]
        return updated.charge !== atom.charge ? { ...atom, charge: updated.charge } : atom
      })
      bonds = [...bonds, makeBond(centerAtom.id, neighborAtom.id)].sort(compareBond)
    }
  }

  return { ...state, atoms, bonds }
}
