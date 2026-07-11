import type {
  ProfileParams,
  ProfileResult,
  SearchParams,
  SearchResult,
  SupermemoryClient,
  WriteMemoryParams,
  WriteMemoryResult
} from './types.js'

interface StoredMemory {
  id: string
  content: string
  containerTag: string
  metadata?: Record<string, unknown>
}

/**
 * In-memory test double for SupermemoryClient. `search` ignores relevance
 * ranking and returns every memory in the matching containerTag — real
 * hybrid-search relevance is Supermemory's job and is verified manually
 * against the live local server via scripts/dev-interrogate.ts, not here.
 */
export class FakeSupermemoryClient implements SupermemoryClient {
  private memories: StoredMemory[] = []
  private nextId = 1

  async writeMemory(params: WriteMemoryParams): Promise<WriteMemoryResult> {
    const id = `mem_${this.nextId++}`
    this.memories.push({
      id,
      content: params.content,
      containerTag: params.containerTag,
      metadata: params.metadata
    })
    return { id, status: 'done' }
  }

  async search(params: SearchParams): Promise<SearchResult> {
    const matches = this.memories.filter((memory) => memory.containerTag === params.containerTag)
    return {
      results: matches.map((memory) => ({
        id: memory.id,
        content: memory.content,
        metadata: memory.metadata
      }))
    }
  }

  async getProfile(params: ProfileParams): Promise<ProfileResult> {
    const count = this.memories.filter((memory) => memory.containerTag === params.containerTag).length
    return { profile: { containerTag: params.containerTag, memoryCount: count } }
  }
}
