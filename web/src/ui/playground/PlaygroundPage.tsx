import { getRouteApi } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import type { BoardSpec } from '../../engine/schema'
import { DeserializeError, deserialize } from '../../engine/serialize'
import { Board } from './Board'
import { Palette } from './Palette'
import { PartInspector } from './PartInspector'
import { TransportControls } from './TransportControls'
import { usePlaygroundEngine } from './usePlaygroundEngine'

const routeApi = getRouteApi('/')

export const EMPTY_BOARD: BoardSpec = { version: 1, name: 'Untitled board', parts: [] }

export function PlaygroundPage() {
  const { share } = routeApi.useSearch()
  const engine = usePlaygroundEngine(EMPTY_BOARD)
  const [shareError, setShareError] = useState<string | null>(null)
  const loadedShareRef = useRef<string | null>(null)

  useEffect(() => {
    if (!share || loadedShareRef.current === share) return
    loadedShareRef.current = share
    try {
      const spec = deserialize(share)
      engine.loadSpec(spec)
      setShareError(null)
    } catch (error) {
      setShareError(error instanceof DeserializeError ? error.message : 'Could not load that share link.')
    }
    // engine identity is stable across renders (useReducer-backed), safe to omit
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [share])

  return (
    <div className="playground-page">
      <Palette engine={engine} />
      <div className="board-column">
        <TransportControls engine={engine} />
        {shareError ? <p className="form-error">{shareError}</p> : null}
        <Board engine={engine} />
      </div>
      <div className="side-column">
        <PartInspector engine={engine} />
      </div>
    </div>
  )
}
