import { store } from '../store/servers'

type Command = 'start' | 'pause' | 'stop' | 'restart'

export async function sendControl(url: string, command: Command): Promise<void> {
  await fetch(`${url}/control`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ command }),
  })
}

export async function sendConfig(
  url: string,
  body: { anchor?: number; angle?: number; mass?: number; stringLength?: number },
): Promise<void> {
  await fetch(`${url}/config`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export function broadcastControl(command: Command): Promise<PromiseSettledResult<void>[]> {
  return Promise.allSettled(store.servers.map((s) => sendControl(s.url, command)))
}
