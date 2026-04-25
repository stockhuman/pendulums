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

export interface ConfigureBody {
  angle?: number
  mass?: number
  stringLength?: number
}

export function parseConfigureBody(body: unknown): ConfigureBody | null {
  if (typeof body !== 'object' || body === null) return null
  const b = body as Record<string, unknown>
  const result: ConfigureBody = {}
  if (b.angle !== undefined) {
    if (typeof b.angle !== 'number') return null
    result.angle = b.angle
  }
  if (b.mass !== undefined) {
    if (typeof b.mass !== 'number' || b.mass <= 0) return null
    result.mass = b.mass
  }
  if (b.stringLength !== undefined) {
    if (typeof b.stringLength !== 'number' || b.stringLength <= 0) return null
    result.stringLength = b.stringLength
  }
  return result
}

export function parseControlCommand(body: unknown): ControlCommand | null {
  if (typeof body !== 'object' || body === null) return null
  const cmd = (body as Record<string, unknown>).command
  return typeof cmd === 'string' && VALID_COMMANDS.has(cmd as ControlCommand)
    ? (cmd as ControlCommand)
    : null
}
