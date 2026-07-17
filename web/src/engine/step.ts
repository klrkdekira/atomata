import { runArms } from './parts/arm'
import { runBonders } from './parts/bonder'
import { runDebonders } from './parts/debonder'
import { runAtomSources } from './parts/atomSource'
import { runWaste } from './parts/waste'
import { applyReactions } from './reactions'
import type { BoardSpec } from './schema'
import type { SimState } from './types'

// The tick pipeline. Every stage takes (parts, state) and returns a new
// state — no stage reads wall-clock time or Math.random, and every internal
// iteration order is sorted by cell coordinate, so step(spec, state) is a
// pure function: same input, same output, always.
export function step(spec: BoardSpec, state: SimState): SimState {
  let next = state
  next = runAtomSources(spec.parts, next)
  next = runArms(spec.parts, next)
  next = runBonders(spec.parts, next)
  next = runDebonders(spec.parts, next)
  next = applyReactions(spec.parts, next)
  next = runWaste(spec.parts, next)
  return { ...next, tick: next.tick + 1 }
}
