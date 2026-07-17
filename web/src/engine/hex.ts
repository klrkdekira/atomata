export type Axial = { readonly q: number; readonly r: number }

export function axial(q: number, r: number): Axial {
  return { q, r }
}

export function axialEq(a: Axial, b: Axial): boolean {
  return a.q === b.q && a.r === b.r
}

export function axialKey(a: Axial): string {
  return `${a.q},${a.r}`
}

export function axialAdd(a: Axial, b: Axial): Axial {
  return { q: a.q + b.q, r: a.r + b.r }
}

export function axialScale(a: Axial, factor: number): Axial {
  return { q: a.q * factor, r: a.r * factor }
}

// Pointy-top axial neighbor vectors, index = direction, clockwise starting at east.
// Rotating an arm by one `rotate_cw` step advances its facing by +1 (mod 6) in this table.
export const HEX_DIRECTIONS: readonly Axial[] = [
  { q: 1, r: 0 },
  { q: 1, r: -1 },
  { q: 0, r: -1 },
  { q: -1, r: 0 },
  { q: -1, r: 1 },
  { q: 0, r: 1 },
]

export type Direction = 0 | 1 | 2 | 3 | 4 | 5

export function normalizeDirection(direction: number): Direction {
  return (((direction % 6) + 6) % 6) as Direction
}

export function rotateDirection(direction: Direction, steps: number): Direction {
  return normalizeDirection(direction + steps)
}

export function axialNeighbor(a: Axial, direction: Direction): Axial {
  return axialAdd(a, HEX_DIRECTIONS[direction])
}

export function axialDistance(a: Axial, b: Axial): number {
  const dq = a.q - b.q
  const dr = a.r - b.r
  return (Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2
}

export function axialAreNeighbors(a: Axial, b: Axial): boolean {
  return axialDistance(a, b) === 1
}

export function axialNeighbors(a: Axial): Axial[] {
  return HEX_DIRECTIONS.map((_, direction) => axialNeighbor(a, direction as Direction))
}

// Stable sort comparator (by q then r) — the single source of "coordinate order"
// used throughout the engine to keep tick processing deterministic.
export function compareAxial(a: Axial, b: Axial): number {
  return a.q - b.q || a.r - b.r
}

export function axialToPixel(a: Axial, size: number): { x: number; y: number } {
  const x = size * (Math.sqrt(3) * a.q + (Math.sqrt(3) / 2) * a.r)
  const y = size * (1.5 * a.r)
  return { x, y }
}
