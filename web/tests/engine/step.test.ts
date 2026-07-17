import { describe, expect, it } from 'vitest'
import { molecularFormula, canonicalSmiles } from '../../src/chem/adapter'
import type { GraphAtom, GraphBond } from '../../src/chem/adapter'
import { DictionaryNamer } from '../../src/chem/namer'
import molecules from '../../src/data/molecules.json'
import { init } from '../../src/engine/board'
import { deriveMolecules } from '../../src/engine/molecule'
import type { BoardSpec } from '../../src/engine/schema'
import { step } from '../../src/engine/step'
import type { SimState } from '../../src/engine/types'

const waterBoard: BoardSpec = {
  version: 1,
  name: 'Water assembly',
  parts: [
    { kind: 'atomSource', id: 'src-o', cell: { q: 0, r: 0 }, element: 'O' },
    { kind: 'atomSource', id: 'src-h1', cell: { q: 1, r: 0 }, element: 'H' },
    { kind: 'atomSource', id: 'src-h2', cell: { q: 1, r: -1 }, element: 'H' },
    { kind: 'bonder', id: 'bonder-1', cell: { q: 0, r: 0 } },
  ],
}

function formulaOf(state: SimState) {
  const [molecule] = deriveMolecules(state.atoms, state.bonds)
  const indexOf = new Map(molecule.atomIds.map((id, index) => [id, index]))
  const atoms: GraphAtom[] = molecule.atomIds.map((id) => {
    const atom = state.atoms.find((a) => a.id === id)!
    return { element: atom.element, charge: atom.charge }
  })
  const bonds: GraphBond[] = molecule.bonds.map((bond) => [indexOf.get(bond.a)!, indexOf.get(bond.b)!])
  return { formula: molecularFormula(atoms, bonds), smiles: canonicalSmiles(atoms, bonds) }
}

describe('engine step', () => {
  it('assembles H2O from atom sources over a bonder', () => {
    let state = init(waterBoard)
    state = step(waterBoard, state)

    expect(state.atoms).toHaveLength(3)
    const molecules_ = deriveMolecules(state.atoms, state.bonds)
    expect(molecules_).toHaveLength(1)
    expect(molecules_[0].atomIds).toHaveLength(3)

    const { formula, smiles } = formulaOf(state)
    expect(formula).toBe('H2O')
    const namer = new DictionaryNamer(molecules)
    expect(namer.lookup(smiles)?.name).toBe('Water')
  })

  it('reaches a stable steady state once cells are occupied', () => {
    let state = init(waterBoard)
    for (let i = 0; i < 5; i++) state = step(waterBoard, state)
    expect(state.atoms).toHaveLength(3)
    expect(state.spawnedCount).toBe(3)
  })

  it('is deterministic across 10k ticks', () => {
    function runFor(ticks: number): SimState {
      let state = init(waterBoard)
      for (let i = 0; i < ticks; i++) state = step(waterBoard, state)
      return state
    }
    const a = runFor(10_000)
    const b = runFor(10_000)
    expect(JSON.stringify(a)).toBe(JSON.stringify(b))
  })
})
