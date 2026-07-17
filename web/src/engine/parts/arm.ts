import { axialAdd, axialEq, axialScale, rotateDirection, HEX_DIRECTIONS } from '../hex'
import type { Axial } from '../hex'
import type { PartSpec } from '../schema'
import type { ArmRuntime, AtomState, SimState } from '../types'

type ArmPart = Extract<PartSpec, { kind: 'arm' }>

export function initArmRuntime(part: ArmPart): ArmRuntime {
  return { partId: part.id, facing: part.facing, length: 1, programCounter: 0, heldAtomId: null }
}

export function gripperCell(base: Axial, arm: ArmRuntime): Axial {
  return axialAdd(base, axialScale(HEX_DIRECTIONS[arm.facing], arm.length))
}

// Arms carry a single loose (unbonded) atom at a time — this game models arms
// as transport for raw atoms into bonder range, not rigid-body drags of whole
// assembled molecules. Once atoms are bonded they stay put on the board.
export function runArms(parts: readonly PartSpec[], state: SimState): SimState {
  const armParts = new Map(
    parts
      .filter((part): part is ArmPart => part.kind === 'arm')
      .map((part) => [part.id, part] as const),
  )
  const orderedRuntimes = state.arms
    .slice()
    .sort((a, b) => {
      const partA = armParts.get(a.partId)
      const partB = armParts.get(b.partId)
      if (!partA || !partB) return a.partId.localeCompare(b.partId)
      return partA.cell.q - partB.cell.q || partA.cell.r - partB.cell.r
    })

  const bondedAtomIds = new Set(state.bonds.flatMap((bond) => [bond.a, bond.b]))
  let atoms = state.atoms
  const armsById = new Map(state.arms.map((arm) => [arm.partId, arm]))

  function atomAt(cell: Axial): AtomState | undefined {
    return atoms.find((atom) => axialEq(atom.cell, cell))
  }

  for (const runtime of orderedRuntimes) {
    const part = armParts.get(runtime.partId)
    if (!part) continue

    const instruction = part.program[runtime.programCounter % part.program.length]
    let next: ArmRuntime = runtime

    switch (instruction) {
      case 'rotate_cw':
        next = { ...runtime, facing: rotateDirection(runtime.facing, 1) }
        break
      case 'rotate_ccw':
        next = { ...runtime, facing: rotateDirection(runtime.facing, -1) }
        break
      case 'extend':
        next = { ...runtime, length: Math.min(runtime.length + 1, part.maxLength) }
        break
      case 'retract':
        next = { ...runtime, length: Math.max(runtime.length - 1, 1) }
        break
      case 'grab': {
        if (runtime.heldAtomId === null) {
          const target = atomAt(gripperCell(part.cell, runtime))
          if (target && !bondedAtomIds.has(target.id)) {
            next = { ...runtime, heldAtomId: target.id }
          }
        }
        break
      }
      case 'drop': {
        if (runtime.heldAtomId !== null) {
          const dropCell = gripperCell(part.cell, runtime)
          if (!atomAt(dropCell)) {
            const heldId = runtime.heldAtomId
            atoms = atoms.map((atom) => (atom.id === heldId ? { ...atom, cell: dropCell } : atom))
            next = { ...runtime, heldAtomId: null }
          }
        }
        break
      }
      case 'wait':
        break
    }

    if (next.heldAtomId !== null) {
      const newGripper = gripperCell(part.cell, next)
      const heldId = next.heldAtomId
      atoms = atoms.map((atom) => (atom.id === heldId ? { ...atom, cell: newGripper } : atom))
    }

    next = { ...next, programCounter: (runtime.programCounter + 1) % part.program.length }
    armsById.set(runtime.partId, next)
  }

  return {
    ...state,
    atoms: atoms.slice().sort((a, b) => a.id - b.id),
    arms: state.arms.map((arm) => armsById.get(arm.partId) ?? arm),
  }
}
