import express from 'express'
import { getEvents, getState, postConfigure, postControl } from './pendulumController'

export const pendulumRouter = express.Router()

pendulumRouter.get('/state', getState)
pendulumRouter.post('/control', postControl)
pendulumRouter.post('/configure', postConfigure)
pendulumRouter.get('/events', getEvents)
