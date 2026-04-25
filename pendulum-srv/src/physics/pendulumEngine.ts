import { EventEmitter } from 'events'
import type { PendulumState, PendulumStatus } from '@/api/pendulum/pendulumModel'

export interface PendulumConfig {
  anchor: number
  initialAngle: number
  mass: number
  stringLength: number
}

const TICK_INTERVAL_MS = 16

export class PendulumEngine extends EventEmitter {
  private config: PendulumConfig
  private state: PendulumState
  private intervalId: NodeJS.Timeout | null = null

  constructor(config: PendulumConfig) {
    super()
    this.config = config
    this.state = this.buildInitialState()
  }

  getState(): PendulumState {
    return { ...this.state }
  }

  getConfig(): PendulumConfig {
    return { ...this.config }
  }

  start(): void {
    if (this.intervalId || this.state.status === 'running') return
    this.setStatus('running')
    this.intervalId = setInterval(() => this.tick(TICK_INTERVAL_MS / 1000), TICK_INTERVAL_MS)
  }

  pause(): void {
    if (this.state.status !== 'running') return
    this.clearInterval()
    this.setStatus('paused')
  }

  stop(): void {
    if (this.state.status === 'stopped') return
    this.clearInterval()
    this.setStatus('stopped')
  }

  restart(): void {
    this.clearInterval()
    this.state = this.buildInitialState()
    this.start()
  }

  configure(updates: Partial<Pick<PendulumConfig, 'initialAngle' | 'mass' | 'stringLength'>>): void {
    if (this.state.status !== 'stopped')
      throw new Error('Cannot configure while running — stop the pendulum first')
    this.config = { ...this.config, ...updates }
    this.state = this.buildInitialState()
    this.emit('state', this.getState())
  }

  private buildInitialState(): PendulumState {
    // TODO: derive x,y tip position from anchor + angle + stringLength
    throw new Error('not implemented')
  }

  private tick(_dt: number): void {
    // TODO: swing the pendulum, update state, emit SSE clients
    throw new Error('not implemented')
    // this.emit('state', this.getState())
  }

  private setStatus(status: PendulumStatus): void {
    this.state = { ...this.state, status }
    this.emit('state', this.getState())
  }

  private clearInterval(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }
}
