import type { PendulumConfig } from '@/physics/pendulumEngine'
import type { PendulumState } from '@/api/pendulum/pendulumModel'
import { logger } from '@/server'

const MASS_TO_RADIUS = 0.15 // Matches frontend 0.15 * mass

export interface PeerPollerConfig {
  peerUrls: string[]
  pollIntervalMs: number
  onCollision: () => void
  onAllPeersRestarted: () => void
}

export class PeerPoller {
  private config: PeerPollerConfig
  private intervalId: NodeJS.Timeout | null = null
  private isHandlingCollision = false
  private getOwnState: (() => PendulumState) | null = null
  private getOwnConfig: (() => PendulumConfig) | null = null
  private peerMasses: Map<string, number> = new Map()

  constructor(config: PeerPollerConfig) {
    this.config = config
  }

  start(getOwnState: () => PendulumState, getOwnConfig: () => PendulumConfig): void {
    this.getOwnState = getOwnState
    this.getOwnConfig = getOwnConfig
    this.fetchPeerConfigs()
    this.intervalId = setInterval(() => this.pollPeers(), this.config.pollIntervalMs)
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  reset(): void {
    this.isHandlingCollision = false
  }

  receiveRestart(): void {
    this.config.onAllPeersRestarted()
  }

  private async fetchPeerConfigs(): Promise<void> {
    await Promise.allSettled(
      this.config.peerUrls.map(async (url) => {
        try {
          const res = await fetch(url + '/config')
          if (!res.ok) return
          const cfg: PendulumConfig = await res.json()
          this.peerMasses.set(url, cfg.mass)
        } catch (error) {
          logger.warn(`Could not fetch config from ${url}: ${error}`)
        }
      }),
    )
  }

  private async pollPeers(): Promise<void> {
    if (this.isHandlingCollision) return
    await Promise.allSettled(
      this.config.peerUrls.map(async (url) => {
        try {
          const response = await fetch(url + '/state')
          if (!response.ok) throw new Error('HTTP error ' + response.status)
          const peerState: PendulumState = await response.json()
          const ownState = this.getOwnState?.()
          const ownMass = this.getOwnConfig?.().mass ?? 1
          const peerMass = this.peerMasses.get(url) ?? 1
          if (
            !this.isHandlingCollision &&
            ownState &&
            this.checkCollision(ownState, ownMass, peerState, peerMass)
          ) {
            this.isHandlingCollision = true
            await this.broadcastStop()
            this.config.onCollision()
          }
        } catch (error) {
          logger.error(`Error fetching state from ${url}: ${error}`)
        }
      }),
    )
  }

  private checkCollision(
    own: PendulumState,
    ownMass: number,
    peer: PendulumState,
    peerMass: number,
  ): boolean {
    const dx = own.x - peer.x
    const dy = own.y - peer.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    const combinedRadius = MASS_TO_RADIUS * (ownMass + peerMass)
    return distance < combinedRadius
  }

  private async broadcastStop(): Promise<void> {
    await Promise.allSettled(
      this.config.peerUrls.map(async (url) => {
        try {
          const response = await fetch(url + '/control', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ command: 'stop' }),
          })
          if (!response.ok) throw new Error('HTTP error ' + response.status)
        } catch (error) {
          logger.error(`Error broadcasting stop to ${url}: ${error}`)
        }
      }),
    )
  }

  async broadcastRestart(): Promise<void> {
    await Promise.allSettled(
      this.config.peerUrls.map(async (url) => {
        try {
          const response = await fetch(url + '/control', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ command: 'restart' }),
          })
          if (!response.ok) throw new Error('HTTP error ' + response.status)
        } catch (error) {
          logger.error(`Error broadcasting restart to ${url}: ${error}`)
        }
      }),
    )
    // All peers have been notified (or failed gracefully); schedule own restart.
    this.config.onAllPeersRestarted()
  }
}
