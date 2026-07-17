import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { ELEMENTS, ElementSchema } from '../../engine/schema'
import { ArmProgramEditor } from './ArmProgramEditor'
import type { PlaygroundEngine } from './usePlaygroundEngine'

const AtomSourceFormSchema = z.object({ element: ElementSchema })

function AtomSourceForm({
  partId,
  element,
  engine,
}: {
  partId: string
  element: z.infer<typeof ElementSchema>
  engine: PlaygroundEngine
}) {
  const { register, handleSubmit, reset } = useForm({
    resolver: zodResolver(AtomSourceFormSchema),
    defaultValues: { element },
  })

  useEffect(() => reset({ element }), [element, reset])

  const onSubmit = handleSubmit((values) => engine.updatePart(partId, { element: values.element }))

  return (
    <form onSubmit={onSubmit}>
      <label>
        Element
        <select {...register('element')}>
          {ELEMENTS.map((symbol) => (
            <option key={symbol} value={symbol}>
              {symbol}
            </option>
          ))}
        </select>
      </label>
      <button type="submit" className="primary">
        Apply
      </button>
    </form>
  )
}

export function PartInspector({ engine }: { engine: PlaygroundEngine }) {
  const { state, removePart } = engine
  const part = state.spec.parts.find((p) => p.id === state.selectedPartId)

  if (!part) {
    return (
      <div className="part-inspector empty">
        <h2>Inspector</h2>
        <p>Select a part on the board to edit it.</p>
      </div>
    )
  }

  return (
    <div className="part-inspector">
      <h2>Inspector</h2>
      <p className="part-kind">{part.kind}</p>
      <p className="part-cell">
        cell ({part.cell.q}, {part.cell.r})
      </p>

      {part.kind === 'atomSource' ? (
        <AtomSourceForm partId={part.id} element={part.element} engine={engine} />
      ) : null}
      {part.kind === 'arm' ? <ArmProgramEditor part={part} engine={engine} /> : null}

      <button type="button" className="danger" onClick={() => removePart(part.id)}>
        Delete part
      </button>
    </div>
  )
}
