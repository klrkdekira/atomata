import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { z } from 'zod'
import { ARM_INSTRUCTIONS, DirectionSchema, ArmInstructionSchema } from '../../engine/schema'
import type { Direction, PartSpec } from '../../engine/schema'
import type { PlaygroundEngine } from './usePlaygroundEngine'

const ArmFormSchema = z.object({
  facing: DirectionSchema,
  maxLength: z.number().int().min(1).max(4),
  program: z.array(z.object({ value: ArmInstructionSchema })).min(1).max(64),
})
type ArmFormValues = z.infer<typeof ArmFormSchema>

type ArmPart = Extract<PartSpec, { kind: 'arm' }>

export function ArmProgramEditor({ part, engine }: { part: ArmPart; engine: PlaygroundEngine }) {
  const { register, control, handleSubmit, reset, formState } = useForm<ArmFormValues>({
    resolver: zodResolver(ArmFormSchema),
    defaultValues: {
      facing: part.facing,
      maxLength: part.maxLength,
      program: part.program.map((value) => ({ value })),
    },
  })
  const { fields, append, remove, move } = useFieldArray({ control, name: 'program' })

  useEffect(() => {
    reset({
      facing: part.facing,
      maxLength: part.maxLength,
      program: part.program.map((value) => ({ value })),
    })
  }, [part.id, part.facing, part.maxLength, part.program, reset])

  const onSubmit = handleSubmit((values) => {
    engine.updatePart(part.id, {
      facing: values.facing as Direction,
      maxLength: values.maxLength,
      program: values.program.map((row: { value: ArmFormValues['program'][number]['value'] }) => row.value),
    })
  })

  return (
    <form className="arm-program-editor" onSubmit={onSubmit}>
      <label>
        Facing
        <select {...register('facing', { valueAsNumber: true })}>
          {[0, 1, 2, 3, 4, 5].map((direction) => (
            <option key={direction} value={direction}>
              {direction}
            </option>
          ))}
        </select>
      </label>
      <label>
        Max length
        <input type="number" min={1} max={4} {...register('maxLength', { valueAsNumber: true })} />
      </label>

      <h4>Instruction tape</h4>
      <ol className="instruction-tape">
        {fields.map((field, index) => (
          <li key={field.id}>
            <select {...register(`program.${index}.value` as const)}>
              {ARM_INSTRUCTIONS.map((instruction) => (
                <option key={instruction} value={instruction}>
                  {instruction}
                </option>
              ))}
            </select>
            <button type="button" onClick={() => move(index, Math.max(0, index - 1))} disabled={index === 0}>
              ↑
            </button>
            <button
              type="button"
              onClick={() => move(index, Math.min(fields.length - 1, index + 1))}
              disabled={index === fields.length - 1}
            >
              ↓
            </button>
            <button type="button" onClick={() => remove(index)} disabled={fields.length === 1}>
              Remove
            </button>
          </li>
        ))}
      </ol>
      <button type="button" onClick={() => append({ value: 'wait' })}>
        Add instruction
      </button>

      {formState.errors.program ? <p className="form-error">Program needs at least one instruction.</p> : null}

      <button type="submit" className="primary">
        Apply program
      </button>
    </form>
  )
}
