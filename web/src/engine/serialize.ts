import { BoardSpecSchema } from './schema'
import type { BoardSpec } from './schema'

function toBase64(text: string): string {
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

function fromBase64(encoded: string): string {
  const binary = atob(encoded)
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

export function serialize(spec: BoardSpec): string {
  return toBase64(JSON.stringify(spec))
}

export class DeserializeError extends Error {}

// Share strings and localStorage saves are untrusted input the moment they've
// round-tripped through a text box — fail closed through the schema rather
// than letting a hand-edited or corrupted string crash the engine downstream.
export function deserialize(encoded: string): BoardSpec {
  let json: string
  try {
    json = fromBase64(encoded)
  } catch {
    throw new DeserializeError('Not a valid share string.')
  }

  let raw: unknown
  try {
    raw = JSON.parse(json)
  } catch {
    throw new DeserializeError('Share string did not contain valid board data.')
  }

  const result = BoardSpecSchema.safeParse(raw)
  if (!result.success) {
    throw new DeserializeError(`Share string failed validation: ${result.error.message}`)
  }
  return result.data
}
