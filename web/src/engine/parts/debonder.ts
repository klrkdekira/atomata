import { axialEq } from '../hex'
import type { PartSpec } from '../schema'
import type { BondState, SimState } from '../types'

export function runDebonders(parts: readonly PartSpec[], state: SimState): SimState {
  const debonders = parts
    .filter((part): part is Extract<PartSpec, { kind: 'debonder' }> => part.kind === 'debonder')
    .slice()
    .sort((a, b) => a.cell.q - b.cell.q || a.cell.r - b.cell.r)
  if (debonders.length === 0) return state

  let bonds = state.bonds

  for (const debonder of debonders) {
    const centerAtom = state.atoms.find((atom) => axialEq(atom.cell, debonder.cell))
    if (!centerAtom) continue

    const attached = bonds
      .filter((bond) => bond.a === centerAtom.id || bond.b === centerAtom.id)
      .sort((x, y) => {
        const otherX = x.a === centerAtom.id ? x.b : x.a
        const otherY = y.a === centerAtom.id ? y.b : y.a
        return otherX - otherY
      })
    const toRemove: BondState | undefined = attached[0]
    if (!toRemove) continue

    bonds = bonds.filter((bond) => bond !== toRemove)
  }

  return bonds === state.bonds ? state : { ...state, bonds }
}
