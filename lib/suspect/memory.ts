import type { SupermemoryClient } from '../supermemory/types.js'

export async function seedGroundTruth(
  containerTag: string,
  facts: string[],
  client: SupermemoryClient
): Promise<void> {
  for (const fact of facts) {
    await client.writeMemory({
      content: fact,
      containerTag,
      metadata: { source: 'ground-truth' }
    })
  }
}

export type StatementSource = 'player-told' | 'evidence-shown'

export async function tellSuspect(
  containerTag: string,
  content: string,
  source: StatementSource,
  client: SupermemoryClient
): Promise<void> {
  await client.writeMemory({
    content,
    containerTag,
    metadata: { source }
  })
}
