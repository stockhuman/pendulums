import { env } from '@common/utils/envConfig'
import { PeerPoller } from '@/peers/peerPoller'
import { PendulumEngine } from '@/physics/pendulumEngine'

export const engine = new PendulumEngine({
  anchor: env.ANCHOR,
  initialAngle: env.INITIAL_ANGLE,
  mass: env.MASS,
  stringLength: env.STRING_LENGTH,
})

export const poller = new PeerPoller({
  peerUrls: env.PEER_URLS ? env.PEER_URLS.split(',').filter(Boolean) : [],
  onCollision: () => {
    engine.stop()
    poller.stop()
    poller.broadcastRestart()
  },
  onAllPeersRestarted: () => {
    setTimeout(() => {
      poller.reset()
      engine.restart()
      poller.start(
        () => engine.getState(),
        () => engine.getConfig(),
      )
    }, 5000)
  },
})
