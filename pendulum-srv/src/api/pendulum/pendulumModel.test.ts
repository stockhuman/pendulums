import { describe, expect, it } from 'vitest'
import { parseConfigBody, parseControlCommand } from './pendulumModel'

describe('parseControlCommand', () => {
  it('accepts valid commands', () => {
    expect(parseControlCommand({ command: 'start' })).toBe('start')
    expect(parseControlCommand({ command: 'pause' })).toBe('pause')
    expect(parseControlCommand({ command: 'stop' })).toBe('stop')
    expect(parseControlCommand({ command: 'restart' })).toBe('restart')
  })

  it('rejects unknown command', () => {
    expect(parseControlCommand({ command: 'fly' })).toBeNull()
  })

  it('rejects missing command field', () => {
    expect(parseControlCommand({})).toBeNull()
  })

  it('rejects non-object body', () => {
    expect(parseControlCommand('start')).toBeNull()
    expect(parseControlCommand(null)).toBeNull()
  })
})

describe('parseConfigBody', () => {
  it('accepts a full valid body', () => {
    expect(parseConfigBody({ angle: 0.5, mass: 2, stringLength: 1.5 })).toEqual({
      angle: 0.5,
      mass: 2,
      stringLength: 1.5,
    })
  })

  it('accepts partial bodies', () => {
    expect(parseConfigBody({ mass: 3 })).toEqual({ mass: 3 })
    expect(parseConfigBody({ stringLength: 0.5 })).toEqual({ stringLength: 0.5 })
    expect(parseConfigBody({})).toEqual({})
  })

  it('rejects non-positive mass', () => {
    expect(parseConfigBody({ mass: 0 })).toBeNull()
    expect(parseConfigBody({ mass: -1 })).toBeNull()
  })

  it('rejects non-positive stringLength', () => {
    expect(parseConfigBody({ stringLength: 0 })).toBeNull()
  })

  it('rejects non-numeric fields', () => {
    expect(parseConfigBody({ angle: 'big' })).toBeNull()
    expect(parseConfigBody({ mass: true })).toBeNull()
  })

  it('rejects non-object body', () => {
    expect(parseConfigBody(null)).toBeNull()
    expect(parseConfigBody('hello')).toBeNull()
  })
})
