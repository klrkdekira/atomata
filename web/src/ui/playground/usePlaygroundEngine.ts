import { useCallback, useEffect, useReducer, useRef } from 'react'
import { init } from '../../engine/board'
import type { Axial, Direction, Element, PartSpec, BoardSpec } from '../../engine/schema'
import { step } from '../../engine/step'
import type { SimState } from '../../engine/types'

export type Tool =
  | { id: 'select' }
  | { id: 'place-atomSource'; element: Element }
  | { id: 'place-bonder' }
  | { id: 'place-debonder' }
  | { id: 'place-heat' }
  | { id: 'place-catalyst' }
  | { id: 'place-waste' }
  | { id: 'place-arm' }

export type PlaygroundState = {
  readonly spec: BoardSpec
  readonly sim: SimState
  readonly playing: boolean
  readonly ticksPerSecond: number
  readonly tool: Tool
  readonly selectedPartId: string | null
}

type Action =
  | { type: 'LOAD_SPEC'; spec: BoardSpec }
  | { type: 'PLACE_PART'; cell: Axial }
  | { type: 'UPDATE_PART'; id: string; patch: Partial<PartSpec> }
  | { type: 'REMOVE_PART'; id: string }
  | { type: 'SET_TOOL'; tool: Tool }
  | { type: 'SELECT_PART'; id: string | null }
  | { type: 'PLAY' }
  | { type: 'PAUSE' }
  | { type: 'STEP' }
  | { type: 'SET_SPEED'; ticksPerSecond: number }
  | { type: 'RESET' }

function makePartId(kind: string): string {
  return `${kind}-${crypto.randomUUID().slice(0, 8)}`
}

function partForTool(tool: Tool, cell: Axial): PartSpec | null {
  switch (tool.id) {
    case 'select':
      return null
    case 'place-atomSource':
      return { kind: 'atomSource', id: makePartId('atomSource'), cell, element: tool.element }
    case 'place-bonder':
      return { kind: 'bonder', id: makePartId('bonder'), cell }
    case 'place-debonder':
      return { kind: 'debonder', id: makePartId('debonder'), cell }
    case 'place-heat':
      return { kind: 'heat', id: makePartId('heat'), cell }
    case 'place-catalyst':
      return { kind: 'catalyst', id: makePartId('catalyst'), cell }
    case 'place-waste':
      return { kind: 'waste', id: makePartId('waste'), cell }
    case 'place-arm':
      return {
        kind: 'arm',
        id: makePartId('arm'),
        cell,
        facing: 0 as Direction,
        maxLength: 2,
        program: ['wait'],
      }
  }
}

function reducer(state: PlaygroundState, action: Action): PlaygroundState {
  switch (action.type) {
    case 'LOAD_SPEC':
      return {
        ...state,
        spec: action.spec,
        sim: init(action.spec),
        playing: false,
        selectedPartId: null,
        tool: { id: 'select' },
      }
    case 'PLACE_PART': {
      const occupied = state.spec.parts.some(
        (part) => part.cell.q === action.cell.q && part.cell.r === action.cell.r && part.kind === partKindOfTool(state.tool),
      )
      if (occupied) return state
      const part = partForTool(state.tool, action.cell)
      if (!part) return state
      const spec = { ...state.spec, parts: [...state.spec.parts, part] }
      return { ...state, spec, sim: init(spec), selectedPartId: part.id }
    }
    case 'UPDATE_PART': {
      const spec = {
        ...state.spec,
        parts: state.spec.parts.map((part) =>
          part.id === action.id ? ({ ...part, ...action.patch } as PartSpec) : part,
        ),
      }
      return { ...state, spec, sim: init(spec) }
    }
    case 'REMOVE_PART': {
      const spec = { ...state.spec, parts: state.spec.parts.filter((part) => part.id !== action.id) }
      return {
        ...state,
        spec,
        sim: init(spec),
        selectedPartId: state.selectedPartId === action.id ? null : state.selectedPartId,
      }
    }
    case 'SET_TOOL':
      return { ...state, tool: action.tool, selectedPartId: null }
    case 'SELECT_PART':
      return { ...state, selectedPartId: action.id, tool: { id: 'select' } }
    case 'PLAY':
      return { ...state, playing: true }
    case 'PAUSE':
      return { ...state, playing: false }
    case 'STEP':
      return { ...state, sim: step(state.spec, state.sim) }
    case 'SET_SPEED':
      return { ...state, ticksPerSecond: action.ticksPerSecond }
    case 'RESET':
      return { ...state, sim: init(state.spec), playing: false }
  }
}

function partKindOfTool(tool: Tool): PartSpec['kind'] | null {
  if (tool.id === 'select') return null
  if (tool.id === 'place-atomSource') return 'atomSource'
  return tool.id.replace('place-', '') as PartSpec['kind']
}

function initialState(spec: BoardSpec): PlaygroundState {
  return {
    spec,
    sim: init(spec),
    playing: false,
    ticksPerSecond: 4,
    tool: { id: 'select' },
    selectedPartId: null,
  }
}

export function usePlaygroundEngine(initialSpec: BoardSpec) {
  const [state, dispatch] = useReducer(reducer, initialSpec, initialState)
  const specRef = useRef(state.spec)
  specRef.current = state.spec

  useEffect(() => {
    if (!state.playing) return
    const intervalMs = 1000 / state.ticksPerSecond
    const id = setInterval(() => dispatch({ type: 'STEP' }), intervalMs)
    return () => clearInterval(id)
  }, [state.playing, state.ticksPerSecond])

  const loadSpec = useCallback((spec: BoardSpec) => dispatch({ type: 'LOAD_SPEC', spec }), [])
  const placePart = useCallback((cell: Axial) => dispatch({ type: 'PLACE_PART', cell }), [])
  const updatePart = useCallback(
    (id: string, patch: Partial<PartSpec>) => dispatch({ type: 'UPDATE_PART', id, patch }),
    [],
  )
  const removePart = useCallback((id: string) => dispatch({ type: 'REMOVE_PART', id }), [])
  const setTool = useCallback((tool: Tool) => dispatch({ type: 'SET_TOOL', tool }), [])
  const selectPart = useCallback((id: string | null) => dispatch({ type: 'SELECT_PART', id }), [])
  const play = useCallback(() => dispatch({ type: 'PLAY' }), [])
  const pause = useCallback(() => dispatch({ type: 'PAUSE' }), [])
  const tickOnce = useCallback(() => dispatch({ type: 'STEP' }), [])
  const setSpeed = useCallback(
    (ticksPerSecond: number) => dispatch({ type: 'SET_SPEED', ticksPerSecond }),
    [],
  )
  const reset = useCallback(() => dispatch({ type: 'RESET' }), [])

  return {
    state,
    loadSpec,
    placePart,
    updatePart,
    removePart,
    setTool,
    selectPart,
    play,
    pause,
    tickOnce,
    setSpeed,
    reset,
  }
}

export type PlaygroundEngine = ReturnType<typeof usePlaygroundEngine>
