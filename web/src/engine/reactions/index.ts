import type { PartSpec } from '../schema'
import type { SimState } from '../types'

// Filled in for M3 (synthesis/decomposition/combustion/neutralization). Kept
// as an explicit no-op seam so step.ts's tick order never has to change.
export function applyReactions(parts: readonly PartSpec[], state: SimState): SimState {
  void parts
  return state
}
