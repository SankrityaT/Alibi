export interface WriteMemoryParams {
  content: string
  containerTag: string
  metadata?: Record<string, string | number | boolean>
  customId?: string
}

export interface WriteMemoryResult {
  id: string
  status: string
}

export interface SearchParams {
  q: string
  containerTag: string
  limit?: number
  searchMode?: 'hybrid'
  // Supermemory's default relevance cutoff (~0.55) is high enough that generic
  // interrogation questions ("what do you remember about that night?") score
  // below it against the specific stored facts and retrieve nothing — the
  // suspect then claims to remember nothing. A low threshold surfaces the
  // top-ranked memories regardless, which is what the game wants.
  threshold?: number
}

export interface SearchResultItem {
  id: string
  content: string
  metadata?: Record<string, unknown>
}

export interface SearchResult {
  results: SearchResultItem[]
}

export interface ProfileParams {
  containerTag: string
  q?: string
}

export interface ProfileResult {
  profile: Record<string, unknown>
}

export interface SupermemoryClient {
  writeMemory(params: WriteMemoryParams): Promise<WriteMemoryResult>
  search(params: SearchParams): Promise<SearchResult>
  getProfile(params: ProfileParams): Promise<ProfileResult>
}
