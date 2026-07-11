import type {
  ProfileParams,
  ProfileResult,
  SearchParams,
  SearchResult,
  SupermemoryClient,
  WriteMemoryParams,
  WriteMemoryResult
} from './types.js'

/**
 * A SupermemoryClient that remembers nothing: writes are no-ops and searches
 * always return zero memories. This powers the "Memory: OFF" toggle — with this
 * client a suspect has no recall at all, so they forget everything you've told
 * them and every planted lie evaporates. It's the demo's proof that the game
 * depends on Supermemory: swap this in and the mystery falls apart.
 */
export class NullSupermemoryClient implements SupermemoryClient {
  async writeMemory(_params: WriteMemoryParams): Promise<WriteMemoryResult> {
    return { id: 'memory-disabled', status: 'disabled' }
  }

  async search(_params: SearchParams): Promise<SearchResult> {
    return { results: [] }
  }

  async getProfile(params: ProfileParams): Promise<ProfileResult> {
    return { profile: { containerTag: params.containerTag, memoryDisabled: true } }
  }
}
