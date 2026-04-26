import { store } from '../store/servers'

type Command = 'start' | 'pause' | 'stop' | 'restart'

export async function sendControl(url: string, command: Command): Promise<void> {
  await fetch(`${url}/control`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ command }),
  })
}

export function broadcastControl(command: Command): Promise<PromiseSettledResult<void>[]> {
  return Promise.allSettled(store.servers.map((s) => sendControl(s.url, command)))
}
