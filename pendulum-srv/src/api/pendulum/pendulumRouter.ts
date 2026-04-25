import express from 'express'
import { getEvents, getState, postControl } from './pendulumController'

export const pendulumRouter = express.Router()

pendulumRouter.get('/state', getState)
pendulumRouter.post('/control', postControl)
pendulumRouter.get('/events', getEvents)
