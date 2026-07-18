import { describe, expect, it } from 'vitest'
import { fallbackCase } from '../../content/cases/fallbackCase.js'
import { FakeSupermemoryClient } from '../supermemory/fakeClient.js'
import { FakeAnthropicClient } from '../anthropic/fakeClient.js'
import { seedCase } from '../case/seed.js'
import { DETECTIVE_CONTAINER_TAG, suspectContainerTag } from '../case/types.js'
import { runVerb } from './verbs.js'

function summarizingResponder() {
  // Echo a deterministic summary so the test can assert a fact came back.
  return () => 'CCTV footage places the suspect away from their claimed location.'
}

describe('runVerb', () => {
  it('cctv: returns a fact and writes exactly one verb memory into the detective container', async () => {
    const supermemory = new FakeSupermemoryClient()
    const anthropic = new FakeAnthropicClient(summarizingResponder())
    await seedCase(fallbackCase, { supermemory })

    const result = await runVerb(
      { kind: 'cctv', query: 'Where was Mara during the theft?', location: 'Atrium' },
      { supermemory, anthropic }
    )

    expect(typeof result.fact).toBe('string')
    expect(result.fact.length).toBeGreaterThan(0)
    // The verb pulled the cctv-kind world evidence.
    expect(result.retrieved.length).toBeGreaterThan(0)

    const { results } = await supermemory.search({ q: '', containerTag: DETECTIVE_CONTAINER_TAG })
    const verbMemories = results.filter((r) => r.metadata?.source === 'verb')
    expect(verbMemories).toHaveLength(1)
    expect(verbMemories[0].metadata?.kind).toBe('cctv')
    expect(verbMemories[0].content).toBe(result.fact)
  })

  it('phone: scopes retrieval to the requested kind', async () => {
    const supermemory = new FakeSupermemoryClient()
    const anthropic = new FakeAnthropicClient(summarizingResponder())
    await seedCase(fallbackCase, { supermemory })

    const result = await runVerb(
      { kind: 'phone', query: 'phone records' },
      { supermemory, anthropic }
    )

    // Only phone-kind world evidence is pulled — the burner-call record — and
    // not the cctv/forensics/etc. evidence sharing the world container.
    expect(result.retrieved.length).toBeGreaterThan(0)
    const combined = result.retrieved.map((r) => r.content).join(' ')
    expect(combined).toContain('burner')
    expect(combined).not.toContain('Atrium camera')
    expect(typeof result.fact).toBe('string')
  })

  it('present-evidence: writes the fact into the suspect container and not the detective container', async () => {
    const supermemory = new FakeSupermemoryClient()
    const anthropic = new FakeAnthropicClient(summarizingResponder())

    const fact = 'The badge log shows you in the vault corridor at 21:52.'
    const result = await runVerb(
      { kind: 'present-evidence', query: '', suspectId: 'mara', fact },
      { supermemory, anthropic }
    )

    expect(result.fact).toBe(fact)
    expect(result.evidenceId).toBeTruthy()

    const suspectMemories = await supermemory.search({
      q: '',
      containerTag: suspectContainerTag('mara')
    })
    const shown = suspectMemories.results.filter((r) => r.metadata?.source === 'evidence-shown')
    expect(shown).toHaveLength(1)
    expect(shown[0].content).toBe(fact)

    const detective = await supermemory.search({ q: '', containerTag: DETECTIVE_CONTAINER_TAG })
    expect(detective.results).toHaveLength(0)
  })

  it('present-evidence: does not call the summarizer', async () => {
    const supermemory = new FakeSupermemoryClient()
    const anthropic = new FakeAnthropicClient(summarizingResponder())

    await runVerb(
      { kind: 'present-evidence', query: '', suspectId: 'mara', fact: 'A fact.' },
      { supermemory, anthropic }
    )

    expect(anthropic.calls).toHaveLength(0)
  })
})
