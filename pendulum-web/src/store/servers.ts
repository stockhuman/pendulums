import { proxy } from 'valtio'

export interface PendulumConfig {
  anchor: number
  initialAngle: number
  mass: number
  stringLength: number
}

export type PendulumStatus = 'running' | 'paused' | 'stopped' | 'restarting'

export interface PendulumState {
  angle: number
  angularVelocity: number
  x: number
  y: number
  status: PendulumStatus
}

export interface ServerEntry {
  url: string
  config: PendulumConfig | null
  state: PendulumState | null
  connected: boolean
}

const DEFAULT_URLS = [
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:3003',
  'http://localhost:3004',
  'http://localhost:3005',
]

const LS_KEY = 'pendulum-server-urls'

function loadUrls(): string[] {
  try {
    const stored = localStorage.getItem(LS_KEY)
    if (stored) return JSON.parse(stored)
  } catch (e) {
    console.warn('Error loading server URLs from local storage:', e)
  }
  return DEFAULT_URLS
}

export function saveUrls(urls: string[]): void {
  localStorage.setItem(LS_KEY, JSON.stringify(urls))
}

function makeEntry(url: string): ServerEntry {
  return { url, config: null, state: null, connected: false }
}

export const store = proxy<{ servers: ServerEntry[] }>({
  servers: loadUrls().map(makeEntry),
})

export function addServer(url: string): void {
  store.servers.push(makeEntry(url))
}

export function removeServer(index: number): void {
  store.servers.splice(index, 1)
}

export function setServerUrl(index: number, url: string): void {
  store.servers[index].url = url
}
