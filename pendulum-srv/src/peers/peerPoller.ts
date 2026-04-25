import type { PendulumState } from '@/api/pendulum/pendulumModel'
import { logger } from '@/server'

export interface PeerPollerConfig {
  peerUrls: string[]
  pollIntervalMs: number
  collisionThreshold: number
  onCollision: () => void
  onAllPeersRestarted: () => void
}

export class PeerPoller {
  private config: PeerPollerConfig
  private intervalId: NodeJS.Timeout | null = null
  private restartAcks: Set<string> = new Set()
  private getOwnState: (() => PendulumState) | null = null

  constructor(config: PeerPollerConfig) {
    this.config = config
  }

  start(getOwnState: () => PendulumState): void {
    this.getOwnState = getOwnState
    this.intervalId = setInterval(() => this.pollPeers(), this.config.pollIntervalMs)
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  receiveRestart(fromUrl: string): void {
    this.restartAcks.add(fromUrl)
    if (this.restartAcks.size === this.config.peerUrls.length) {
      this.config.onAllPeersRestarted()
    }
  }

  private async pollPeers(): Promise<void> {
    await Promise.allSettled(
      this.config.peerUrls.map(async (url) => {
        try {
          const response = await fetch(url + '/state')
          if (!response.ok) throw new Error('HTTP error ' + response.status)
          const state = await response.json()
          const ownState = this.getOwnState?.()
          if (ownState && this.checkCollision(ownState, state)) {
            this.broadcastStop()
            this.config.onCollision()
          }
        } catch (error) {
          logger.error(`Error fetching state from ${url}: ${error}`)
        }
      }),
    )
  }

  private checkCollision(own: PendulumState, peer: PendulumState): boolean {
    // TODO: distance between tip (x,y) positions < collisionThreshold
    throw new Error('not implemented')
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
          this.restartAcks.add(url)
          if (this.restartAcks.size === this.config.peerUrls.length) {
            this.config.onAllPeersRestarted()
          }
        } catch (error) {
          logger.error(`Error broadcasting restart to ${url}: ${error}`)
        }
      }),
    )
  }
}
