import { z } from 'zod'

export const ELEMENTS = ['H', 'C', 'N', 'O', 'Na', 'Cl'] as const
export const ElementSchema = z.enum(ELEMENTS)
export type Element = z.infer<typeof ElementSchema>

export const ARM_INSTRUCTIONS = [
  'grab',
  'drop',
  'rotate_cw',
  'rotate_ccw',
  'extend',
  'retract',
  'wait',
] as const
export const ArmInstructionSchema = z.enum(ARM_INSTRUCTIONS)
export type ArmInstruction = z.infer<typeof ArmInstructionSchema>

export const DirectionSchema = z.union([
  z.literal(0),
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
])
export type Direction = z.infer<typeof DirectionSchema>

export const AxialSchema = z.object({
  q: z.number().int(),
  r: z.number().int(),
})
export type Axial = z.infer<typeof AxialSchema>

const PartBaseSchema = z.object({
  id: z.string().min(1),
  cell: AxialSchema,
})

export const AtomSourcePartSchema = PartBaseSchema.extend({
  kind: z.literal('atomSource'),
  element: ElementSchema,
})

export const BonderPartSchema = PartBaseSchema.extend({ kind: z.literal('bonder') })
export const DebonderPartSchema = PartBaseSchema.extend({ kind: z.literal('debonder') })
export const HeatPartSchema = PartBaseSchema.extend({ kind: z.literal('heat') })
export const CatalystPartSchema = PartBaseSchema.extend({ kind: z.literal('catalyst') })
export const WastePartSchema = PartBaseSchema.extend({ kind: z.literal('waste') })

export const ArmPartSchema = PartBaseSchema.extend({
  kind: z.literal('arm'),
  facing: DirectionSchema,
  maxLength: z.number().int().min(1).max(4),
  program: z.array(ArmInstructionSchema).min(1).max(64),
})

export const PartSpecSchema = z.discriminatedUnion('kind', [
  AtomSourcePartSchema,
  BonderPartSchema,
  DebonderPartSchema,
  HeatPartSchema,
  CatalystPartSchema,
  WastePartSchema,
  ArmPartSchema,
])
export type PartSpec = z.infer<typeof PartSpecSchema>
export type PartKind = PartSpec['kind']

export const BOARD_SPEC_VERSION = 1

export const BoardSpecSchema = z.object({
  version: z.literal(BOARD_SPEC_VERSION),
  name: z.string().min(1).max(80),
  parts: z.array(PartSpecSchema).max(512),
})
export type BoardSpec = z.infer<typeof BoardSpecSchema>
