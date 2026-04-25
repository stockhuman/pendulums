import express, { type Request, type Response, type Router } from 'express'

export const healthCheckRouter: Router = express.Router()

healthCheckRouter.get('/', (_req: Request, res: Response) => {
  res.json({ ok: true })
})
