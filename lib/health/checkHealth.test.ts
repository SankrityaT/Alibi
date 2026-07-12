import { describe, expect, it, vi } from 'vitest'
import { checkHealth, isPlayable } from './checkHealth.js'

describe('checkHealth', () => {
  it('marks Supermemory unconfigured (and unreachable-null) when env is missing', async () => {
    const ping = vi.fn()
    const statuses = await checkHealth({}, ping)

    const sm = statuses.find((s) => s.id === 'supermemory')!
    expect(sm.configured).toBe(false)
    expect(sm.reachable).toBeNull()
    // No ping attempted for an unconfigured service.
    expect(ping).not.toHaveBeenCalledWith(undefined)
  })

  it('pings Supermemory when configured and reports reachability', async () => {
    const ping = vi.fn().mockResolvedValue(true)
    const statuses = await checkHealth(
      { supermemoryBaseUrl: 'http://localhost:6767', supermemoryApiKey: 'k' },
      ping
    )

    const sm = statuses.find((s) => s.id === 'supermemory')!
    expect(sm.configured).toBe(true)
    expect(sm.reachable).toBe(true)
    expect(ping).toHaveBeenCalledWith('http://localhost:6767')
  })

  it('treats Claude as required-but-unpingable (reachable null, configured true)', async () => {
    const statuses = await checkHealth({}, vi.fn())
    const claude = statuses.find((s) => s.id === 'claude')!
    expect(claude.required).toBe(true)
    expect(claude.reachable).toBeNull()
    expect(claude.configured).toBe(true)
  })

  it('marks TTS and STT optional and only pings them when configured', async () => {
    const ping = vi.fn().mockResolvedValue(false)
    const statuses = await checkHealth({ kokoroBaseUrl: 'http://localhost:8880' }, ping)

    const tts = statuses.find((s) => s.id === 'tts')!
    const stt = statuses.find((s) => s.id === 'stt')!
    expect(tts.required).toBe(false)
    expect(tts.reachable).toBe(false)
    expect(stt.required).toBe(false)
    expect(stt.reachable).toBeNull() // not configured
    expect(ping).toHaveBeenCalledWith('http://localhost:8880')
    expect(ping).toHaveBeenCalledTimes(1)
  })
})

describe('isPlayable', () => {
  it('is true only when every required service is reachable (or configured-if-unpingable)', async () => {
    const reachable = await checkHealth(
      { supermemoryBaseUrl: 'http://localhost:6767', supermemoryApiKey: 'k' },
      vi.fn().mockResolvedValue(true)
    )
    expect(isPlayable(reachable)).toBe(true)

    const smDown = await checkHealth(
      { supermemoryBaseUrl: 'http://localhost:6767', supermemoryApiKey: 'k' },
      vi.fn().mockResolvedValue(false)
    )
    expect(isPlayable(smDown)).toBe(false)

    const smMissing = await checkHealth({}, vi.fn())
    expect(isPlayable(smMissing)).toBe(false)
  })
})
