import supertest from 'supertest'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { app } from '@/server'

// Prevent real setInterval from firing during HTTP tests
beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('GET /config', () => {
  it('returns the static pendulum config', async () => {
    const res = await supertest(app).get('/config')
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({
      anchor: expect.any(Number),
      initialAngle: expect.any(Number),
      mass: expect.any(Number),
      stringLength: expect.any(Number),
    })
  })
})

describe('GET /state', () => {
  it('returns the current pendulum state', async () => {
    const res = await supertest(app).get('/state')
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({
      angle: expect.any(Number),
      angularVelocity: expect.any(Number),
      x: expect.any(Number),
      y: expect.any(Number),
      status: expect.stringMatching(/^(running|paused|stopped|restarting)$/),
    })
  })
})

describe('POST /control', () => {
  it('rejects an unknown command', async () => {
    const res = await supertest(app).post('/control').send({ command: 'fly' })
    expect(res.status).toBe(400)
  })

  it('accepts stop (idempotent)', async () => {
    const res = await supertest(app).post('/control').send({ command: 'stop' })
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ ok: true, status: 'stopped' })
  })

  it('accepts start and transitions to running', async () => {
    await supertest(app).post('/control').send({ command: 'stop' })
    const res = await supertest(app).post('/control').send({ command: 'start' })
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ ok: true, status: 'running' })
  })
})

describe('POST /config', () => {
  it('rejects non-positive mass', async () => {
    await supertest(app).post('/control').send({ command: 'stop' })
    const res = await supertest(app).post('/config').send({ mass: -1 })
    expect(res.status).toBe(400)
  })

  it('rejects config while running', async () => {
    await supertest(app).post('/control').send({ command: 'start' })
    const res = await supertest(app).post('/config').send({ mass: 2 })
    expect(res.status).toBe(409)
  })

  it('updates config when stopped', async () => {
    await supertest(app).post('/control').send({ command: 'stop' })
    const res = await supertest(app).post('/config').send({ mass: 2, stringLength: 0.5 })
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    const config = await supertest(app).get('/config')
    expect(config.body.mass).toBe(2)
    expect(config.body.stringLength).toBe(0.5)
  })
})
