import type { Request, Response } from 'express'
import { engine, poller } from '@/state'
import { parseControlCommand } from './pendulumModel'
import type { PendulumState } from './pendulumModel'

export function getState(_req: Request, res: Response): void {
  res.json(engine.getState())
}

export function postControl(req: Request, res: Response): void {
  const command = parseControlCommand(req.body)
  if (!command) {
    res.status(400).json({ error: 'command must be one of: start, pause, stop, restart' })
    return
  }

  switch (command) {
    case 'start':
      engine.start()
      break
    case 'pause':
      engine.pause()
      break
    case 'stop':
      engine.stop()
      break
    case 'restart':
      poller.receiveRestart(req.ip ?? 'unknown')
      break
  }

  res.json({ ok: true, status: engine.getState().status })
}

export function getEvents(req: Request, res: Response): void {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()

  res.write(`data: ${JSON.stringify(engine.getState())}\n\n`)

  const onState = (state: PendulumState) => {
    res.write(`data: ${JSON.stringify(state)}\n\n`)
  }

  engine.on('state', onState)
  req.on('close', () => engine.off('state', onState))
}
