import { describe, expect, it } from 'vitest'
import { FakeSupermemoryClient } from '../supermemory/fakeClient.js'
import { seedGroundTruth, tellSuspect } from './memory.js'

describe('seedGroundTruth', () => {
  it('writes one memory per fact, tagged as ground-truth', async () => {
    const client = new FakeSupermemoryClient()

    await seedGroundTruth(
      'suspect-mara',
      ['Rerouted Theo at 21:45.', 'Was at the dispatch desk all night.'],
      client
    )

    const result = await client.search({ q: 'anything', containerTag: 'suspect-mara' })
    expect(result.results).toHaveLength(2)
    expect(result.results.map((item) => item.content)).toEqual([
      'Rerouted Theo at 21:45.',
      'Was at the dispatch desk all night.'
    ])
    expect(result.results[0].metadata).toEqual({ source: 'ground-truth' })
  })
})

describe('tellSuspect', () => {
  it('writes a memory tagged with the given source', async () => {
    const client = new FakeSupermemoryClient()

    await tellSuspect(
      'suspect-mara',
      'The detective told you: "Jonas already confessed."',
      'player-told',
      client
    )

    const result = await client.search({ q: 'anything', containerTag: 'suspect-mara' })
    expect(result.results).toHaveLength(1)
    expect(result.results[0].metadata).toEqual({ source: 'player-told' })
  })

  it('keeps memories isolated per containerTag', async () => {
    const client = new FakeSupermemoryClient()

    await tellSuspect('suspect-mara', 'Only Mara should see this.', 'player-told', client)

    const result = await client.search({ q: 'anything', containerTag: 'suspect-jonas' })
    expect(result.results).toHaveLength(0)
  })
})
