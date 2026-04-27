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

  configure(
    updates: Partial<Pick<PendulumConfig, 'anchor' | 'initialAngle' | 'mass' | 'stringLength'>>,
  ): void {
    if (this.state.status !== 'stopped')
      throw new Error('Cannot configure while running — stop the pendulum first')
    this.config = { ...this.config, ...updates }
    this.state = this.buildInitialState()
    this.emit('state', this.getState())
  }

  private buildInitialState(): PendulumState {
    const { anchor, initialAngle, stringLength } = this.config
    return {
      angle: initialAngle,
      angularVelocity: 0,
      x: anchor + stringLength * Math.sin(initialAngle),
      y: -stringLength * Math.cos(initialAngle),
      status: 'stopped',
    }
  }

  // largely derived from https://stackoverflow.com/questions/64157573/
  private tick(dt: number): void {
    const { anchor, stringLength } = this.config
    const { angle: theta, angularVelocity: omega } = this.state
    const G = 9.81

    const omegaDot = (th: number) => -(G / stringLength) * Math.sin(th)
    const thetaDot = (om: number) => om

    const aOmega = omegaDot(theta)
    const aTheta = thetaDot(omega)
    const bOmega = omegaDot(theta + 0.5 * dt * aTheta)
    const bTheta = thetaDot(omega + 0.5 * dt * aOmega)
    const cOmega = omegaDot(theta + 0.5 * dt * bTheta)
    const cTheta = thetaDot(omega + 0.5 * dt * bOmega)
    const dOmega = omegaDot(theta + dt * cTheta)
    const dTheta = thetaDot(omega + dt * cOmega)

    const newOmega = omega + (dt / 6) * (aOmega + 2 * bOmega + 2 * cOmega + dOmega)
    const newTheta = theta + (dt / 6) * (aTheta + 2 * bTheta + 2 * cTheta + dTheta)

    this.state = {
      ...this.state,
      angle: newTheta,
      angularVelocity: newOmega,
      x: anchor + stringLength * Math.sin(newTheta),
      y: -stringLength * Math.cos(newTheta),
    }

    this.emit('state', this.getState())
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
