import dotenv from 'dotenv'

dotenv.config()

function str(key: string, fallback: string): string {
  return process.env[key] ?? fallback
}

function num(key: string, fallback: number): number {
  const val = process.env[key]
  if (val === undefined) return fallback
  const n = Number(val)
  if (!Number.isFinite(n)) throw new Error(`Env var ${key} must be a number, got "${val}"`)
  return n
}

function nodeEnv(): 'development' | 'production' | 'test' {
  const val = process.env.NODE_ENV ?? 'production'
  if (val !== 'development' && val !== 'production' && val !== 'test')
    throw new Error(`NODE_ENV must be development | production | test, got "${val}"`)
  return val
}

const NODE_ENV = nodeEnv()

export const env = {
  NODE_ENV,
  isDevelopment: NODE_ENV === 'development',
  isProduction: NODE_ENV === 'production',
  isTest: NODE_ENV === 'test',
  HOST: str('HOST', 'localhost'),
  PORT: num('PORT', 8080),
  CORS_ORIGIN: str('CORS_ORIGIN', 'http://localhost:3000'),
  COMMON_RATE_LIMIT_MAX_REQUESTS: num('COMMON_RATE_LIMIT_MAX_REQUESTS', 1000),
  COMMON_RATE_LIMIT_WINDOW_MS: num('COMMON_RATE_LIMIT_WINDOW_MS', 1000),
  PEER_URLS: str('PEER_URLS', ''),
  ANCHOR: num('ANCHOR', 0),
  INITIAL_ANGLE: num('INITIAL_ANGLE', Math.PI / 4),
  MASS: num('MASS', 1),
  STRING_LENGTH: num('STRING_LENGTH', 1),
  COLLISION_THRESHOLD: num('COLLISION_THRESHOLD', 0.001),
}
