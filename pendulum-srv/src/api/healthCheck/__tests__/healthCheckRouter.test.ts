import { StatusCodes } from 'http-status-codes'
import request from 'supertest'

import { app } from '@/server'

describe('Health Check API endpoints', () => {
  it('GET / - success', async () => {
    const response = await request(app).get('/health-check')
    const result: any = response.body

    expect(response.statusCode).toEqual(StatusCodes.OK)
    expect(result.ok).toBeTruthy()
  })
})
