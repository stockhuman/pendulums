import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PendulumEngine, type PendulumConfig } from './pendulumEngine'

const G = 9.81

const base: PendulumConfig = {
  anchor: 0,
  initialAngle: Math.PI / 4,
  mass: 1,
  stringLength: 1,
}

function energy(angle: number, omega: number, L: number): number {
  return 0.5 * L ** 2 * omega ** 2 + G * L * (1 - Math.cos(angle))
}

describe('PendulumEngine — initial state', () => {
  it('computes correct tip position', () => {
    const { x, y } = new PendulumEngine(base).getState()
    expect(x).toBeCloseTo(Math.sin(Math.PI / 4))
    expect(y).toBeCloseTo(-Math.cos(Math.PI / 4))
  })

  it('hangs straight down at zero angle', () => {
    const { x, y } = new PendulumEngine({ ...base, initialAngle: 0 }).getState()
    expect(x).toBeCloseTo(0)
    expect(y).toBeCloseTo(-1)
  })

  it('respects anchor offset', () => {
    const { x } = new PendulumEngine({ ...base, anchor: 5, initialAngle: 0 }).getState()
    expect(x).toBeCloseTo(5)
  })

  it('starts in stopped status', () => {
    expect(new PendulumEngine(base).getState().status).toBe('stopped')
  })
})

describe('PendulumEngine — status transitions', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('start() sets status to running', () => {
    const engine = new PendulumEngine(base)
    engine.start()
    expect(engine.getState().status).toBe('running')
  })

  it('start() is idempotent', () => {
    const engine = new PendulumEngine(base)
    engine.start()
    engine.start()
    expect(engine.getState().status).toBe('running')
  })

  it('pause() halts a running engine', () => {
    const engine = new PendulumEngine(base)
    engine.start()
    engine.pause()
    expect(engine.getState().status).toBe('paused')
  })

  it('stop() is idempotent', () => {
    const engine = new PendulumEngine(base)
    engine.stop()
    engine.stop()
    expect(engine.getState().status).toBe('stopped')
  })

  it('restart() resets angle and resumes', () => {
    const engine = new PendulumEngine(base)
    engine.start()
    vi.advanceTimersByTime(500)
    engine.restart()
    const { angle, status } = engine.getState()
    expect(angle).toBeCloseTo(base.initialAngle)
    expect(status).toBe('running')
  })
})

describe('PendulumEngine — configure()', () => {
  it('updates config and resets tip position', () => {
    const engine = new PendulumEngine(base)
    engine.configure({ stringLength: 2 })
    expect(engine.getConfig().stringLength).toBe(2)
    expect(engine.getState().y).toBeCloseTo(-2 * Math.cos(base.initialAngle))
  })

  it('throws when engine is running', () => {
    vi.useFakeTimers()
    const engine = new PendulumEngine(base)
    engine.start()
    expect(() => engine.configure({ mass: 2 })).toThrow()
    vi.useRealTimers()
  })
})

describe('PendulumEngine — RK4 physics', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('conserves mechanical energy over one period', () => {
    const engine = new PendulumEngine({ ...base, initialAngle: 0.3 })
    const E0 = energy(0.3, 0, 1)

    engine.start()
    vi.advanceTimersByTime(2 * Math.PI * Math.sqrt(1 / G) * 1000)

    const { angle, angularVelocity } = engine.getState()
    expect(energy(angle, angularVelocity, 1)).toBeCloseTo(E0, 3)
  })

  it('returns near initial angle after one period', () => {
    const engine = new PendulumEngine({ ...base, initialAngle: 0.3 })
    engine.start()
    vi.advanceTimersByTime(2 * Math.PI * Math.sqrt(1 / G) * 1000)
    expect(engine.getState().angle).toBeCloseTo(0.3, 1)
  })

  it('emits a state event on each tick', () => {
    const engine = new PendulumEngine(base)
    const ticks: number[] = []
    engine.on('state', (s) => ticks.push(s.angle))
    engine.start()
    vi.advanceTimersByTime(160) // 10 × 16 ms ticks
    expect(ticks.length).toBeGreaterThanOrEqual(10)
  })
})
