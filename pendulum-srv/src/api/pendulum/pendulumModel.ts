export type PendulumStatus = 'running' | 'paused' | 'stopped' | 'restarting'

export interface PendulumState {
  angle: number
  angularVelocity: number
  x: number
  y: number
  status: PendulumStatus
}

export type ControlCommand = 'start' | 'pause' | 'stop' | 'restart'

const VALID_COMMANDS = new Set<ControlCommand>(['start', 'pause', 'stop', 'restart'])

export function parseControlCommand(body: unknown): ControlCommand | null {
  if (typeof body !== 'object' || body === null) return null
  const cmd = (body as Record<string, unknown>).command
  return typeof cmd === 'string' && VALID_COMMANDS.has(cmd as ControlCommand)
    ? (cmd as ControlCommand)
    : null
}
