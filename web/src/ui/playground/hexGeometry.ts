import { axialDistance, axialToPixel } from '../../engine/hex'
import type { Axial } from '../../engine/hex'

export const HEX_SIZE = 30

export function cellsInRadius(radius: number): Axial[] {
  const cells: Axial[] = []
  for (let q = -radius; q <= radius; q++) {
    for (let r = -radius; r <= radius; r++) {
      const cell = { q, r }
      if (axialDistance({ q: 0, r: 0 }, cell) <= radius) cells.push(cell)
    }
  }
  return cells
}

export function hexCorners(center: { x: number; y: number }, size: number): string {
  const points: string[] = []
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i - 30)
    points.push(`${center.x + size * Math.cos(angle)},${center.y + size * Math.sin(angle)}`)
  }
  return points.join(' ')
}

export function cellCenter(cell: Axial): { x: number; y: number } {
  return axialToPixel(cell, HEX_SIZE)
}
