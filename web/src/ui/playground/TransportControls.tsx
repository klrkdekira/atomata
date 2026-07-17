import type { PlaygroundEngine } from './usePlaygroundEngine'

const SPEEDS = [1, 2, 4, 8, 16]

export function TransportControls({ engine }: { engine: PlaygroundEngine }) {
  const { state, play, pause, tickOnce, setSpeed, reset } = engine

  return (
    <div className="transport-controls">
      {state.playing ? (
        <button type="button" onClick={pause}>
          Pause
        </button>
      ) : (
        <button type="button" onClick={play}>
          Play
        </button>
      )}
      <button type="button" onClick={tickOnce} disabled={state.playing}>
        Step
      </button>
      <button type="button" onClick={reset}>
        Reset
      </button>
      <label>
        Speed{' '}
        <select value={state.ticksPerSecond} onChange={(event) => setSpeed(Number(event.target.value))}>
          {SPEEDS.map((speed) => (
            <option key={speed} value={speed}>
              {speed}x
            </option>
          ))}
        </select>
      </label>
      <span className="tick-counter">Tick {state.sim.tick}</span>
    </div>
  )
}
