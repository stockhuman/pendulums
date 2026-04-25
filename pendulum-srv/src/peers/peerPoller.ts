import type { PendulumState } from '@/api/pendulum/pendulumModel'

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
    // Called by POST /control { command: 'restart' } when received from a peer
    // TODO: add fromUrl to restartAcks; when restartAcks.size === peerUrls.length,
    // call onAllPeersRestarted() to trigger the 5-second countdown
    throw new Error('not implemented')
  }

  private async pollPeers(): Promise<void> {
    // TODO: fetch GET /state from each peer URL in parallel (Promise.allSettled)
    // For each successful response, call checkCollision(ownState, peerState)
    // if any collision detected call broadcastStop() then config.onCollision()
    throw new Error('not implemented')
  }

  private checkCollision(own: PendulumState, peer: PendulumState): boolean {
    // TODO: distance between tip (x,y) positions < collisionThreshold
    throw new Error('not implemented')
  }

  private async broadcastStop(): Promise<void> {
    // TODO: POST /control { command: 'stop' } to all peers
    throw new Error('not implemented')
  }

  broadcastRestart(): Promise<void> {
    // TODO: POST /control { command: 'restart' } to all peers
    // Also add own URL to restartAcks and check quorum is already met
    throw new Error('not implemented')
  }
}
