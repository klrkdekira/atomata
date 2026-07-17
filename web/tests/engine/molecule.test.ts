import { describe, expect, it } from 'vitest'
import { deriveMolecules, moleculeContaining } from '../../src/engine/molecule'
import type { AtomState, BondState } from '../../src/engine/types'

function atom(id: number): AtomState {
  return { id, element: 'H', cell: { q: id, r: 0 }, charge: 0 }
}

describe('deriveMolecules', () => {
  it('treats unbonded atoms as singleton molecules', () => {
    const atoms = [atom(1), atom(2)]
    const molecules = deriveMolecules(atoms, [])
    expect(molecules).toHaveLength(2)
    expect(molecules.map((m) => m.atomIds)).toEqual([[1], [2]])
  })

  it('groups bonded atoms into one component, sorted deterministically', () => {
    const atoms = [atom(3), atom(1), atom(2)]
    const bonds: BondState[] = [
      { a: 1, b: 2 },
      { a: 2, b: 3 },
    ]
    const molecules = deriveMolecules(atoms, bonds)
    expect(molecules).toHaveLength(1)
    expect(molecules[0].atomIds).toEqual([1, 2, 3])
    expect(molecules[0].bonds).toEqual([
      { a: 1, b: 2 },
      { a: 2, b: 3 },
    ])
  })

  it('finds the molecule containing a given atom', () => {
    const atoms = [atom(1), atom(2), atom(3)]
    const bonds: BondState[] = [{ a: 1, b: 2 }]
    const molecules = deriveMolecules(atoms, bonds)
    expect(moleculeContaining(molecules, 2)?.atomIds).toEqual([1, 2])
    expect(moleculeContaining(molecules, 3)?.atomIds).toEqual([3])
  })
})
