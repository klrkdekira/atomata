import { initArmRuntime } from './parts/arm'
import type { BoardSpec, PartSpec } from './schema'
import type { SimState } from './types'

export function init(spec: BoardSpec): SimState {
  const arms = spec.parts
    .filter((part): part is Extract<PartSpec, { kind: 'arm' }> => part.kind === 'arm')
    .slice()
    .sort((a, b) => a.id.localeCompare(b.id))
    .map(initArmRuntime)

  return {
    tick: 0,
    nextAtomId: 1,
    atoms: [],
    bonds: [],
    arms,
    wasteCount: 0,
    spawnedCount: 0,
  }
}
