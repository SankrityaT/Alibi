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
