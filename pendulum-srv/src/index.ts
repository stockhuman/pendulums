import { env } from '@common/utils/envConfig'
import { app, logger } from './server'
import { engine, poller } from './state'

const server = app.listen(env.PORT, () => {
  const { NODE_ENV, HOST, PORT } = env
  logger.info(`Server (${NODE_ENV}) running on port http://${HOST}:${PORT}`)
  engine.start()
  poller.start(() => engine.getState())
})

const onCloseSignal = () => {
  logger.info('sigint received, shutting down')
  engine.stop()
  poller.stop()
  server.close(() => {
    logger.info('server closed')
    process.exit()
  })
  setTimeout(() => process.exit(1), 10000).unref()
}

process.on('SIGINT', onCloseSignal)
process.on('SIGTERM', onCloseSignal)
