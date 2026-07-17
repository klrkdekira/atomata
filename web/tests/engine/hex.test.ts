import { describe, expect, it } from 'vitest'
import {
  axialAdd,
  axialAreNeighbors,
  axialDistance,
  axialNeighbor,
  compareAxial,
  normalizeDirection,
  rotateDirection,
} from '../../src/engine/hex'

describe('hex', () => {
  it('adds axials', () => {
    expect(axialAdd({ q: 1, r: 2 }, { q: -1, r: 3 })).toEqual({ q: 0, r: 5 })
  })

  it('rotation wraps around six directions', () => {
    expect(rotateDirection(5, 1)).toBe(0)
    expect(rotateDirection(0, -1)).toBe(5)
    expect(normalizeDirection(-1)).toBe(5)
    expect(normalizeDirection(7)).toBe(1)
  })

  it('every direction step is a distance-1 neighbor', () => {
    const origin = { q: 0, r: 0 }
    for (let dir = 0; dir < 6; dir++) {
      const neighbor = axialNeighbor(origin, dir as 0 | 1 | 2 | 3 | 4 | 5)
      expect(axialDistance(origin, neighbor)).toBe(1)
      expect(axialAreNeighbors(origin, neighbor)).toBe(true)
    }
  })

  it('opposite directions cancel out', () => {
    const origin = { q: 2, r: -1 }
    const out = axialNeighbor(origin, 0)
    const back = axialNeighbor(out, 3)
    expect(back).toEqual(origin)
  })

  it('sorts by q then r', () => {
    const cells = [
      { q: 1, r: 0 },
      { q: 0, r: 1 },
      { q: 0, r: 0 },
    ]
    expect(cells.slice().sort(compareAxial)).toEqual([
      { q: 0, r: 0 },
      { q: 0, r: 1 },
      { q: 1, r: 0 },
    ])
  })
})
