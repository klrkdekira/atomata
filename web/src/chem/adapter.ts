import { Molecule as OclMolecule } from 'openchemlib'
import type { Element } from '../engine/schema'

// Atoms placed by the player (including H) stay explicit all the way into
// OpenChemLib construction — H is a placeable element in this game, never an
// implicit valence filler. OCL's own canonicalization still folds explicit
// terminal hydrogens into the same canonical SMILES a parsed "O"/"CCO" would
// give, so dictionary lookups match standard SMILES entries either way
// (verified: hand-built H-O-H canonicalizes identically to `Molecule.fromSmiles('O')`).
export type GraphAtom = {
  readonly element: Element
  readonly charge: number
}
export type GraphBond = readonly [number, number]

const atomicNoCache = new Map<Element, number>()
function atomicNoFor(element: Element): number {
  let no = atomicNoCache.get(element)
  if (no === undefined) {
    no = OclMolecule.getAtomicNoFromLabel(element)
    atomicNoCache.set(element, no)
  }
  return no
}

function buildOclMolecule(atoms: readonly GraphAtom[], bonds: readonly GraphBond[]): OclMolecule {
  const mol = new OclMolecule(0, 0)
  const indices = atoms.map((atom) => {
    const idx = mol.addAtom(atomicNoFor(atom.element))
    if (atom.charge !== 0) mol.setAtomCharge(idx, atom.charge)
    return idx
  })
  for (const [a, b] of bonds) {
    mol.addBond(indices[a], indices[b])
  }
  mol.ensureHelperArrays(0xffffffff)
  return mol
}

export function validateGraph(atoms: readonly GraphAtom[], bonds: readonly GraphBond[]): boolean {
  try {
    const mol = buildOclMolecule(atoms, bonds)
    mol.validate()
    return true
  } catch {
    return false
  }
}

export function canonicalSmiles(atoms: readonly GraphAtom[], bonds: readonly GraphBond[]): string {
  return buildOclMolecule(atoms, bonds).toIsomericSmiles()
}

export function molecularFormula(atoms: readonly GraphAtom[], bonds: readonly GraphBond[]): string {
  return buildOclMolecule(atoms, bonds).getMolecularFormula().formula
}

const ALKALI_METALS: ReadonlySet<Element> = new Set(['Na'])

export type BondAttempt =
  | { readonly ok: true; readonly atoms: readonly GraphAtom[] }
  | { readonly ok: false }

// A generic Bonder tile's validity check: try a plain covalent bond first; if
// exactly one side is an alkali metal, model the connection as an ionic pair
// (formal +1/-1 charges, no shared electron pair) instead — plain covalent
// bonding between e.g. Na and Cl produces chemically wrong results in OCL
// (an extra implicit H on Cl). Confirmed experimentally during the M0 spike.
export function attemptBond(
  atoms: readonly GraphAtom[],
  bonds: readonly GraphBond[],
  aIndex: number,
  bIndex: number,
): BondAttempt {
  const aIsMetal = ALKALI_METALS.has(atoms[aIndex].element)
  const bIsMetal = ALKALI_METALS.has(atoms[bIndex].element)
  const candidateBonds: GraphBond[] = [...bonds, [aIndex, bIndex]]

  if (aIsMetal !== bIsMetal) {
    const metalIndex = aIsMetal ? aIndex : bIndex
    const partnerIndex = aIsMetal ? bIndex : aIndex
    if (atoms[metalIndex].charge !== 0 || atoms[partnerIndex].charge !== 0) {
      return { ok: false }
    }
    const candidateAtoms = atoms.slice()
    candidateAtoms[metalIndex] = { ...candidateAtoms[metalIndex], charge: 1 }
    candidateAtoms[partnerIndex] = { ...candidateAtoms[partnerIndex], charge: -1 }
    if (!validateGraph(candidateAtoms, candidateBonds)) return { ok: false }
    return { ok: true, atoms: candidateAtoms }
  }

  if (!validateGraph(atoms, candidateBonds)) return { ok: false }
  return { ok: true, atoms }
}
