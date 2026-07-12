import { describe, expect, it } from 'vitest'
import { fallbackCase } from '../../content/cases/fallbackCase.js'
import { FakeSupermemoryClient } from '../supermemory/fakeClient.js'
import { FakeAnthropicClient } from '../anthropic/fakeClient.js'
import { seedCase } from '../case/seed.js'
import { suspectContainerTag } from '../case/types.js'
import { handleInvestigateRequest } from './handleInvestigateRequest.js'

function summarizingResponder() {
  return () => 'CCTV footage shows the atrium was empty during the theft window.'
}

async function seededDeps() {
  const supermemory = new FakeSupermemoryClient()
  const anthropic = new FakeAnthropicClient(summarizingResponder())
  await seedCase(fallbackCase, { supermemory })
  return { supermemory, anthropic }
}

describe('handleInvestigateRequest', () => {
  it('returns 400 when kind is missing', async () => {
    const deps = await seededDeps()
    const result = await handleInvestigateRequest({ query: 'anything' }, deps)
    expect(result.status).toBe(400)
    expect(typeof result.body.error).toBe('string')
  })

  it('returns 400 when kind is unknown', async () => {
    const deps = await seededDeps()
    const result = await handleInvestigateRequest({ kind: 'satellite', query: 'anything' }, deps)
    expect(result.status).toBe(400)
    expect(typeof result.body.error).toBe('string')
  })

  it('returns 400 when the body is not an object', async () => {
    const deps = await seededDeps()
    const result = await handleInvestigateRequest('nope', deps)
    expect(result.status).toBe(400)
  })

  it('returns 200 with a fact for a valid cctv pull', async () => {
    const deps = await seededDeps()
    const result = await handleInvestigateRequest(
      { kind: 'cctv', query: 'Where was Mara?', location: 'Atrium' },
      deps
    )
    expect(result.status).toBe(200)
    expect(typeof result.body.fact).toBe('string')
    expect((result.body.fact as string).length).toBeGreaterThan(0)
    expect(Array.isArray(result.body.retrieved)).toBe(true)
  })

  it('returns 400 when present-evidence is missing suspectId or fact', async () => {
    const deps = await seededDeps()
    const result = await handleInvestigateRequest(
      { kind: 'present-evidence', query: '' },
      deps
    )
    expect(result.status).toBe(400)
  })

  it('returns 200 for a valid present-evidence and writes into the suspect container', async () => {
    const deps = await seededDeps()
    const result = await handleInvestigateRequest(
      { kind: 'present-evidence', suspectId: 'mara', fact: 'You badged in at 21:52.' },
      deps
    )
    expect(result.status).toBe(200)
    expect(result.body.fact).toBe('You badged in at 21:52.')

    const { results } = await deps.supermemory.search({
      q: '',
      containerTag: suspectContainerTag('mara')
    })
    expect(results.some((r) => r.metadata?.source === 'evidence-shown')).toBe(true)
  })
})
