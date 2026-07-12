import type { SupermemoryClient } from '../supermemory/types.js'
import type { CaseFile } from './types.js'
import {
  DETECTIVE_CONTAINER_TAG,
  PLANTED_BY_CULPRIT_TAG,
  WORLD_CONTAINER_TAG,
  suspectContainerTag
} from './types.js'

// Result of seeding a CaseFile into Supermemory. The counts let callers (and
// the trace panel) assert that the world was fully planted before an
// interrogation begins; plantedMemoryId is the durable id of the culprit's
// fabricated memory so retrieval can label it as adversarial.
export interface SeedResult {
  suspectsSeeded: number
  memoriesWritten: number
  plantedMemoryId: string
  evidenceSeeded: number
}

export interface SeedDeps {
  supermemory: SupermemoryClient
}

/**
 * Write a validated CaseFile into Supermemory as the game's ground truth.
 *
 * Four kinds of memory, each in an isolated container so retrieval can never
 * leak one suspect's truth into another's mouth, and so provenance is
 * recoverable from metadata:
 *   - each suspect's groundTruth -> suspect-<id>   {source:'ground-truth', suspectId}
 *   - the culprit's planted false memory -> suspect-<culpritId>
 *                                          {source:'planted', tag: PLANTED_BY_CULPRIT_TAG}
 *   - each evidence.summary -> world-evidence      {source:'evidence', kind, evidenceId}
 *   - each world fact -> detective-case            {source:'world'}
 *
 * The caller is expected to pass a CaseFile that already passed validateCase.
 * Writes are issued sequentially so that a transport-level failure surfaces
 * deterministically rather than racing; the volume (dozens of memories) makes
 * sequential I/O acceptable for a one-time seed.
 */
export async function seedCase(caseFile: CaseFile, deps: SeedDeps): Promise<SeedResult> {
  const { supermemory } = deps
  let memoriesWritten = 0

  // 1. Each suspect's ground truth into their isolated container.
  for (const suspect of caseFile.suspects) {
    const containerTag = suspectContainerTag(suspect.suspectId)
    for (const fact of suspect.groundTruth) {
      await supermemory.writeMemory({
        content: fact,
        containerTag,
        metadata: { source: 'ground-truth', suspectId: suspect.suspectId }
      })
      memoriesWritten += 1
    }
  }

  // 2. The culprit's planted false memory, into the culprit's own container,
  //    tagged so retrieval and the trace panel can flag it as adversarial.
  const { plantedMemory } = caseFile
  const planted = await supermemory.writeMemory({
    content: plantedMemory.content,
    containerTag: suspectContainerTag(plantedMemory.suspectId),
    metadata: { source: 'planted', tag: PLANTED_BY_CULPRIT_TAG }
  })
  memoriesWritten += 1

  // 3. World evidence, addressable by the investigation verbs via kind/id.
  for (const evidence of caseFile.evidence) {
    await supermemory.writeMemory({
      content: evidence.summary,
      containerTag: WORLD_CONTAINER_TAG,
      metadata: { source: 'evidence', kind: evidence.kind, evidenceId: evidence.id }
    })
    memoriesWritten += 1
  }

  // 4. World facts into the detective's own case container.
  for (const fact of caseFile.worldFacts) {
    await supermemory.writeMemory({
      content: fact,
      containerTag: DETECTIVE_CONTAINER_TAG,
      metadata: { source: 'world' }
    })
    memoriesWritten += 1
  }

  return {
    suspectsSeeded: caseFile.suspects.length,
    memoriesWritten,
    plantedMemoryId: planted.id,
    evidenceSeeded: caseFile.evidence.length
  }
}
