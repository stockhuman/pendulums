import type { PendulumConfig } from '@/physics/pendulumEngine'
import type { PendulumState } from '@/api/pendulum/pendulumModel'
import { logger } from '@/server'

const MASS_TO_RADIUS = 0.15 // Matches frontend 0.15 * mass

export interface PeerPollerConfig {
  peerUrls: string[]
  onCollision: () => void
  onAllPeersRestarted: () => void
}

export class PeerPoller {
  private config: PeerPollerConfig
  private isHandlingCollision = false
  private getOwnState: (() => PendulumState) | null = null
  private getOwnConfig: (() => PendulumConfig) | null = null
  private peerConfigs: Map<string, PendulumConfig> = new Map()
  private unreachablePeers: Set<string> = new Set()
  private abortControllers: Map<string, AbortController> = new Map()

  constructor(config: PeerPollerConfig) {
    this.config = config
  }

  start(getOwnState: () => PendulumState, getOwnConfig: () => PendulumConfig): void {
    this.getOwnState = getOwnState
    this.getOwnConfig = getOwnConfig
    this.fetchPeerConfigs().then(() => {
      for (const url of this.config.peerUrls) {
        this.connectToPeer(url)
      }
    })
  }

  stop() {
    for (const controller of this.abortControllers.values()) {
      controller.abort()
    }
    this.abortControllers.clear()
  }

  reset() {
    this.isHandlingCollision = false
  }

  receiveRestart() {
    this.config.onAllPeersRestarted()
  }

  async refreshConfigs() {
    await this.fetchPeerConfigs()
  }

  private connectToPeer(url: string): void {
    const controller = new AbortController()
    this.abortControllers.set(url, controller)
    void this.streamPeer(url, controller.signal)
  }

  // Using an AbortController to reuse the same handshake!
  private async streamPeer(url: string, signal: AbortSignal) {
    while (!signal.aborted) {
      try {
        const response = await fetch(url + '/events', { signal })
        if (!response.ok || !response.body) throw new Error(`HTTP ${response.status}`)

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            this.handlePeerMessage(url, line.slice(6))
          }
        }
      } catch (err) {
        if (signal.aborted) return
        logger.warn(`SSE connection to ${url} lost: ${err} - retrying in 3s`)
        await new Promise<void>((r) => setTimeout(r, 3000))
      }
    }
  }

  private handlePeerMessage(url: string, data: string): void {
    if (this.isHandlingCollision || this.unreachablePeers.has(url)) return
    try {
      const peerState: PendulumState = JSON.parse(data)
      const ownState = this.getOwnState?.()
      const ownMass = this.getOwnConfig?.().mass ?? 1
      const peerMass = this.peerConfigs.get(url)?.mass ?? 1
      if (ownState && this.checkCollision(ownState, ownMass, peerState, peerMass)) {
        this.isHandlingCollision = true
        this.broadcastStop().then(() => this.config.onCollision())
      }
    } catch {
      // malformed event, skip
    }
  }

  private async fetchPeerConfigs() {
    const ownCfg = this.getOwnConfig?.()
    this.unreachablePeers.clear()
    await Promise.allSettled(
      this.config.peerUrls.map(async (url) => {
        try {
          const res = await fetch(url + '/config')
          if (!res.ok) return
          const cfg: PendulumConfig = await res.json()
          this.peerConfigs.set(url, cfg)

          if (ownCfg) {
            const anchorDist = Math.abs(ownCfg.anchor - cfg.anchor)
            const maxReach = ownCfg.stringLength + cfg.stringLength
            const combinedRadius = MASS_TO_RADIUS * (ownCfg.mass + cfg.mass)
            if (anchorDist - maxReach > combinedRadius) {
              this.unreachablePeers.add(url)
              logger.info(`Peer ${url} @anchor=${cfg.anchor} is geometrically unreachable- skipping`)
            }
          }
        } catch (error) {
          logger.warn(`Could not fetch config from ${url}: ${error}`)
          this.unreachablePeers.add(url)
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

  private async broadcastStop() {
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
    this.config.onAllPeersRestarted()
  }
}
