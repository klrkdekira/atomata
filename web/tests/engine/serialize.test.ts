import { describe, expect, it } from 'vitest'
import { deserialize, DeserializeError, serialize } from '../../src/engine/serialize'
import type { BoardSpec } from '../../src/engine/schema'

const sample: BoardSpec = {
  version: 1,
  name: 'Round trip fixture',
  parts: [
    { kind: 'atomSource', id: 'src-o', cell: { q: 0, r: 0 }, element: 'O' },
    { kind: 'atomSource', id: 'src-h1', cell: { q: 1, r: 0 }, element: 'H' },
    { kind: 'atomSource', id: 'src-h2', cell: { q: 1, r: -1 }, element: 'H' },
    { kind: 'bonder', id: 'bonder-1', cell: { q: 0, r: 0 } },
    { kind: 'debonder', id: 'debonder-1', cell: { q: -2, r: 0 } },
    { kind: 'heat', id: 'heat-1', cell: { q: -1, r: -1 } },
    { kind: 'catalyst', id: 'catalyst-1', cell: { q: -1, r: 1 } },
    { kind: 'waste', id: 'waste-1', cell: { q: 3, r: 0 } },
    {
      kind: 'arm',
      id: 'arm-1',
      cell: { q: 2, r: 0 },
      facing: 3,
      maxLength: 2,
      program: ['grab', 'rotate_cw', 'drop', 'rotate_ccw', 'wait'],
    },
  ],
}

describe('serialize / deserialize', () => {
  it('round-trips a board spec exactly', () => {
    const roundTripped = deserialize(serialize(sample))
    expect(roundTripped).toEqual(sample)
  })

  it('rejects garbage input', () => {
    expect(() => deserialize('not-base64-json!!')).toThrow(DeserializeError)
  })

  it('rejects a payload that fails schema validation', () => {
    const badPayload = btoa(JSON.stringify({ version: 1, name: 'x', parts: [{ kind: 'nonsense' }] }))
    expect(() => deserialize(badPayload)).toThrow(DeserializeError)
  })
})
