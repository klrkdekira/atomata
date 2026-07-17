import { ELEMENTS } from '../../engine/schema'
import type { Tool, PlaygroundEngine } from './usePlaygroundEngine'

const STATIC_TOOLS: { tool: Tool; label: string }[] = [
  { tool: { id: 'place-bonder' }, label: 'Bonder' },
  { tool: { id: 'place-debonder' }, label: 'Debonder' },
  { tool: { id: 'place-heat' }, label: 'Heat tile' },
  { tool: { id: 'place-catalyst' }, label: 'Catalyst tile' },
  { tool: { id: 'place-waste' }, label: 'Waste output' },
  { tool: { id: 'place-arm' }, label: 'Rotating arm' },
]

function toolsEqual(a: Tool, b: Tool): boolean {
  if (a.id !== b.id) return false
  if (a.id === 'place-atomSource' && b.id === 'place-atomSource') return a.element === b.element
  return true
}

export function Palette({ engine }: { engine: PlaygroundEngine }) {
  const { state, setTool } = engine

  return (
    <div className="palette">
      <h2>Palette</h2>
      <button
        type="button"
        className={state.tool.id === 'select' ? 'tool selected' : 'tool'}
        onClick={() => setTool({ id: 'select' })}
      >
        Select / inspect
      </button>

      <h3>Atom sources</h3>
      <div className="tool-grid">
        {ELEMENTS.map((element) => {
          const tool: Tool = { id: 'place-atomSource', element }
          return (
            <button
              key={element}
              type="button"
              className={toolsEqual(state.tool, tool) ? 'tool selected' : 'tool'}
              onClick={() => setTool(tool)}
            >
              {element}
            </button>
          )
        })}
      </div>

      <h3>Parts</h3>
      <div className="tool-grid">
        {STATIC_TOOLS.map(({ tool, label }) => (
          <button
            key={tool.id}
            type="button"
            className={toolsEqual(state.tool, tool) ? 'tool selected' : 'tool'}
            onClick={() => setTool(tool)}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
