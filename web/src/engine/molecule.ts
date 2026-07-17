import { compareBond } from './types'
import type { AtomState, BondState, Molecule } from './types'

class UnionFind {
  private readonly parent: Map<number, number> = new Map()

  find(x: number): number {
    let root = x
    while (this.parent.has(root) && this.parent.get(root) !== root) {
      root = this.parent.get(root)!
    }
    if (!this.parent.has(x)) this.parent.set(x, x)
    this.parent.set(x, root)
    return root
  }

  union(a: number, b: number): void {
    const rootA = this.find(a)
    const rootB = this.find(b)
    if (rootA !== rootB) this.parent.set(rootA, rootB)
  }
}

// Molecules are derived, never stored: a connected component of the current
// atom/bond graph. Component order and each component's atomIds/bonds are all
// sorted for determinism — this output feeds tick processing directly.
export function deriveMolecules(atoms: readonly AtomState[], bonds: readonly BondState[]): Molecule[] {
  const uf = new UnionFind()
  for (const atom of atoms) uf.find(atom.id)
  for (const bond of bonds) uf.union(bond.a, bond.b)

  const groups = new Map<number, number[]>()
  for (const atom of atoms) {
    const root = uf.find(atom.id)
    const group = groups.get(root)
    if (group) group.push(atom.id)
    else groups.set(root, [atom.id])
  }

  const bondsByRoot = new Map<number, BondState[]>()
  for (const bond of bonds) {
    const root = uf.find(bond.a)
    const group = bondsByRoot.get(root)
    if (group) group.push(bond)
    else bondsByRoot.set(root, [bond])
  }

  const molecules: Molecule[] = []
  for (const [root, atomIds] of groups) {
    atomIds.sort((a, b) => a - b)
    const componentBonds = (bondsByRoot.get(root) ?? []).slice().sort(compareBond)
    molecules.push({ atomIds, bonds: componentBonds })
  }
  molecules.sort((a, b) => a.atomIds[0] - b.atomIds[0])
  return molecules
}

export function moleculeContaining(molecules: readonly Molecule[], atomId: number): Molecule | undefined {
  return molecules.find((m) => m.atomIds.includes(atomId))
}
