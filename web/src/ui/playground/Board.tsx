import { axialEq } from '../../engine/hex'
import type { Axial } from '../../engine/hex'
import type { PartSpec } from '../../engine/schema'
import { gripperCell } from '../../engine/parts/arm'
import { ELEMENT_COLOR, ELEMENT_TEXT_COLOR } from './elementStyle'
import { cellCenter, cellsInRadius, hexCorners, HEX_SIZE } from './hexGeometry'
import type { PlaygroundEngine } from './usePlaygroundEngine'

const PART_LABEL: Record<PartSpec['kind'], string> = {
  atomSource: '',
  bonder: 'B',
  debonder: 'D',
  heat: 'H•',
  catalyst: 'C•',
  waste: 'W',
  arm: 'A',
}

const PART_FILL: Record<PartSpec['kind'], string> = {
  atomSource: '#2c2f3a',
  bonder: '#c98a2b',
  debonder: '#7d5423',
  heat: '#c0392b',
  catalyst: '#2b8fc9',
  waste: '#555555',
  arm: '#5a3fa0',
}

const BOARD_RADIUS = 6

export function Board({ engine }: { engine: PlaygroundEngine }) {
  const { state, placePart, selectPart } = engine
  const cells = cellsInRadius(BOARD_RADIUS)
  const padding = HEX_SIZE * 2
  const extent = cellCenter({ q: BOARD_RADIUS, r: 0 }).x + padding
  const viewBox = `${-extent} ${-extent} ${extent * 2} ${extent * 2}`

  function partAt(cell: Axial): PartSpec | undefined {
    return state.spec.parts.find((part) => axialEq(part.cell, cell))
  }

  function handleCellClick(cell: Axial) {
    if (state.tool.id === 'select') {
      const part = partAt(cell)
      selectPart(part?.id ?? null)
    } else {
      placePart(cell)
    }
  }

  return (
    <svg className="board" viewBox={viewBox} role="img" aria-label="Hex grid board">
      <g>
        {cells.map((cell) => {
          const center = cellCenter(cell)
          const part = partAt(cell)
          const selected = part && part.id === state.selectedPartId
          return (
            <g
              key={`${cell.q},${cell.r}`}
              onClick={() => handleCellClick(cell)}
              style={{ cursor: 'pointer' }}
            >
              <polygon
                points={hexCorners(center, HEX_SIZE - 1)}
                fill={part ? PART_FILL[part.kind] : 'var(--cell-bg)'}
                stroke={selected ? '#ffcc00' : 'var(--cell-border)'}
                strokeWidth={selected ? 3 : 1}
              />
              {part && part.kind === 'atomSource' ? (
                <text
                  x={center.x}
                  y={center.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={ELEMENT_TEXT_COLOR[part.element]}
                  fontSize={14}
                  fontWeight={700}
                >
                  {part.element}
                </text>
              ) : part ? (
                <text
                  x={center.x}
                  y={center.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="#fff"
                  fontSize={12}
                  fontWeight={700}
                >
                  {PART_LABEL[part.kind]}
                </text>
              ) : null}
            </g>
          )
        })}
      </g>

      <g>
        {state.spec.parts
          .filter((part): part is Extract<PartSpec, { kind: 'arm' }> => part.kind === 'arm')
          .map((part) => {
            const runtime = state.sim.arms.find((arm) => arm.partId === part.id)
            if (!runtime) return null
            const base = cellCenter(part.cell)
            const tip = cellCenter(gripperCell(part.cell, runtime))
            return (
              <g key={part.id}>
                <line x1={base.x} y1={base.y} x2={tip.x} y2={tip.y} stroke="#5a3fa0" strokeWidth={4} />
                <circle cx={tip.x} cy={tip.y} r={6} fill={runtime.heldAtomId !== null ? '#ffcc00' : '#5a3fa0'} />
              </g>
            )
          })}
      </g>

      <g>
        {state.sim.bonds.map((bond) => {
          const a = state.sim.atoms.find((atom) => atom.id === bond.a)
          const b = state.sim.atoms.find((atom) => atom.id === bond.b)
          if (!a || !b) return null
          const pa = cellCenter(a.cell)
          const pb = cellCenter(b.cell)
          return (
            <line
              key={`${bond.a}-${bond.b}`}
              x1={pa.x}
              y1={pa.y}
              x2={pb.x}
              y2={pb.y}
              stroke="#222"
              strokeWidth={3}
            />
          )
        })}
        {state.sim.atoms.map((atom) => {
          const center = cellCenter(atom.cell)
          return (
            <g key={atom.id}>
              <circle cx={center.x} cy={center.y} r={12} fill={ELEMENT_COLOR[atom.element]} stroke="#111" />
              <text
                x={center.x}
                y={center.y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={11}
                fontWeight={700}
                fill={ELEMENT_TEXT_COLOR[atom.element]}
              >
                {atom.element}
                {atom.charge > 0 ? '+' : atom.charge < 0 ? '−' : ''}
              </text>
            </g>
          )
        })}
      </g>
    </svg>
  )
}
