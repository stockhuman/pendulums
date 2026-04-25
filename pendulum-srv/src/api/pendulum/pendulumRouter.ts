import express from 'express'
import { getConfig, getEvents, getState, postConfig, postControl } from './pendulumController'

export const pendulumRouter = express.Router()

pendulumRouter.get('/config', getConfig)
pendulumRouter.post('/config', postConfig)
pendulumRouter.get('/state', getState)
pendulumRouter.post('/control', postControl)
pendulumRouter.get('/events', getEvents)
