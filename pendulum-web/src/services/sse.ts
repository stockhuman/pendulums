import { store } from '../store/servers'

const sources = new Map<number, EventSource>()

async function fetchConfig(index: number): Promise<void> {
  try {
    const res = await fetch(`${store.servers[index].url}/config`)
    if (res.ok) store.servers[index].config = await res.json()
  } catch (e) {
    console.warn(`Could not fetch config from ${store.servers[index]?.url}:`, e)
  }
}

export function connect(index: number): void {
  disconnect(index)

  const entry = store.servers[index]
  if (!entry) return

  fetchConfig(index)

  const source = new EventSource(`${entry.url}/events`)

  source.onopen = () => {
    store.servers[index].connected = true
  }
  source.onmessage = (e) => {
    const data = JSON.parse(e.data)
    const entry = store.servers[index]
    if (!entry.state) {
      entry.state = data
    } else {
      entry.state.angle = data.angle
      entry.state.angularVelocity = data.angularVelocity
      entry.state.x = data.x
      entry.state.y = data.y
      entry.state.status = data.status
    }
  }
  source.onerror = () => {
    store.servers[index].connected = false
  }

  sources.set(index, source)
}

export function disconnect(index: number): void {
  sources.get(index)?.close()
  sources.delete(index)
  if (store.servers[index]) {
    store.servers[index].connected = false
  }
}

export function connectAll(): void {
  store.servers.forEach((_, i) => connect(i))
}

export function disconnectAll(): void {
  store.servers.forEach((_, i) => disconnect(i))
}

// Call after mutating store.servers (add / remove / url change)
export function reconnect(index: number): void {
  connect(index)
}
