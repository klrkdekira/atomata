import type { Axial, Direction, Element } from './schema'

export type AtomState = {
  readonly id: number
  readonly element: Element
  readonly cell: Axial
  readonly charge: number
}

// Canonical order: a < b, always. Enforced by `makeBond`.
export type BondState = {
  readonly a: number
  readonly b: number
}

export type ArmRuntime = {
  readonly partId: string
  readonly facing: Direction
  readonly length: number
  readonly programCounter: number
  readonly heldAtomId: number | null
}

export type SimState = {
  readonly tick: number
  readonly nextAtomId: number
  readonly atoms: readonly AtomState[]
  readonly bonds: readonly BondState[]
  readonly arms: readonly ArmRuntime[]
  readonly wasteCount: number
  readonly spawnedCount: number
}

export function makeBond(a: number, b: number): BondState {
  return a < b ? { a, b } : { a: b, b: a }
}

export function compareBond(x: BondState, y: BondState): number {
  return x.a - y.a || x.b - y.b
}

export type Molecule = {
  readonly atomIds: readonly number[]
  readonly bonds: readonly BondState[]
}
