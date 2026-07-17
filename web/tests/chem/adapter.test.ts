import { describe, expect, it } from 'vitest'
import { attemptBond, canonicalSmiles, molecularFormula, validateGraph } from '../../src/chem/adapter'
import type { GraphAtom, GraphBond } from '../../src/chem/adapter'
import { DictionaryNamer } from '../../src/chem/namer'
import molecules from '../../src/data/molecules.json'

function atom(element: GraphAtom['element'], charge = 0): GraphAtom {
  return { element, charge }
}

describe('chem adapter', () => {
  it('identifies ethanol from an explicit-hydrogen atom graph', () => {
    // CH3-CH2-OH: C0-C1-O2, H3,H4,H5 on C0, H6,H7 on C1, H8 on O2
    const atoms: GraphAtom[] = [
      atom('C'),
      atom('C'),
      atom('O'),
      atom('H'),
      atom('H'),
      atom('H'),
      atom('H'),
      atom('H'),
      atom('H'),
    ]
    const bonds: GraphBond[] = [
      [0, 1],
      [1, 2],
      [0, 3],
      [0, 4],
      [0, 5],
      [1, 6],
      [1, 7],
      [2, 8],
    ]
    expect(validateGraph(atoms, bonds)).toBe(true)
    expect(molecularFormula(atoms, bonds)).toBe('C2H6O')

    const smiles = canonicalSmiles(atoms, bonds)
    const namer = new DictionaryNamer(molecules)
    expect(namer.lookup(smiles)?.name).toBe('Ethanol')
  })

  it('rejects a five-bond carbon as invalid valence', () => {
    const atoms: GraphAtom[] = [atom('C'), atom('H'), atom('H'), atom('H'), atom('H'), atom('H')]
    const bonds: GraphBond[] = [
      [0, 1],
      [0, 2],
      [0, 3],
      [0, 4],
      [0, 5],
    ]
    expect(validateGraph(atoms, bonds)).toBe(false)
  })

  it('names water the same whether hand-built or dictionary-authored', () => {
    const atoms: GraphAtom[] = [atom('O'), atom('H'), atom('H')]
    const bonds: GraphBond[] = [
      [0, 1],
      [0, 2],
    ]
    const smiles = canonicalSmiles(atoms, bonds)
    const namer = new DictionaryNamer(molecules)
    expect(namer.lookup(smiles)?.name).toBe('Water')
  })

  it('bonds sodium to chlorine ionically, not covalently', () => {
    const atoms: GraphAtom[] = [atom('Na'), atom('Cl')]
    const result = attemptBond(atoms, [], 0, 1)
    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error('unreachable')
    expect(result.atoms[0].charge).toBe(1)
    expect(result.atoms[1].charge).toBe(-1)
    expect(molecularFormula(result.atoms, [[0, 1]])).toBe('ClNa')

    const namer = new DictionaryNamer(molecules)
    const smiles = canonicalSmiles(result.atoms, [[0, 1]])
    expect(namer.lookup(smiles)?.name).toBe('Sodium chloride')
  })

  it('bonds sodium to hydroxyl to form sodium hydroxide', () => {
    // O-H already bonded, then Na attaches to O ionically
    const atoms: GraphAtom[] = [atom('Na'), atom('O'), atom('H')]
    const step1 = attemptBond(atoms, [], 1, 2) // O-H covalent
    expect(step1.ok).toBe(true)
    if (!step1.ok) throw new Error('unreachable')
    const step2 = attemptBond(step1.atoms, [[1, 2]], 0, 1) // Na-O ionic
    expect(step2.ok).toBe(true)
    if (!step2.ok) throw new Error('unreachable')

    const bonds: GraphBond[] = [
      [1, 2],
      [0, 1],
    ]
    expect(molecularFormula(step2.atoms, bonds)).toBe('HONa')
    const namer = new DictionaryNamer(molecules)
    const smiles = canonicalSmiles(step2.atoms, bonds)
    expect(namer.lookup(smiles)?.name).toBe('Sodium hydroxide')
  })

  it('refuses to double up an ionic partner', () => {
    const atoms: GraphAtom[] = [atom('Na'), atom('Cl'), atom('Na')]
    const first = attemptBond(atoms, [], 0, 1)
    expect(first.ok).toBe(true)
    if (!first.ok) throw new Error('unreachable')
    const second = attemptBond(first.atoms, [[0, 1]], 2, 1)
    expect(second.ok).toBe(false)
  })
})
