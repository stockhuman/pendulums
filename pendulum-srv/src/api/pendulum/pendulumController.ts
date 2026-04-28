import type { Request, Response } from 'express'
import { engine, poller } from '@/state'
import { parseControlCommand, parseConfigBody } from './pendulumModel'
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
      poller.receiveRestart()
      break
  }

  res.json({ ok: true, status: engine.getState().status })
}

export function getConfig(_req: Request, res: Response): void {
  res.json(engine.getConfig())
}

export function postConfig(req: Request, res: Response): void {
  const body = parseConfigBody(req.body)
  if (!body) {
    res.status(400).json({ error: 'body must be { angle?, mass?, stringLength? } with valid numeric values' })
    return
  }
  if (engine.getState().status !== 'stopped') {
    res.status(409).json({ error: 'stop the pendulum before reconfiguring' })
    return
  }
  engine.configure({
    ...(body.anchor !== undefined && { anchor: body.anchor }),
    ...(body.angle !== undefined && { initialAngle: body.angle }),
    ...(body.mass !== undefined && { mass: body.mass }),
    ...(body.stringLength !== undefined && { stringLength: body.stringLength }),
  })
  poller.refreshConfigs()
  res.json({ ok: true, state: engine.getState() })
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
