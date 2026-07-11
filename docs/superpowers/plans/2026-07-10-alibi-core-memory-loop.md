# Alibi — Core Memory Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prove that a suspect's answers are grounded in isolated, mutable Supermemory-backed memory — with zero UI — before any game/visual work begins.

**Architecture:** A thin `SupermemoryClient` interface wraps the raw Supermemory Local REST API (`/v3/documents`, `/v4/search`, `/v4/profile`), with a real HTTP implementation and an in-memory fake for tests. `respondAsSuspect` composes a static character sheet with live search results into a Claude prompt. `seedGroundTruth`/`tellSuspect` write memories. A CLI harness exercises the real local server manually; an automated integration test proves the same loop against the fake.

**Tech Stack:** TypeScript (ESM), Node 20+, Vitest, tsx, `@anthropic-ai/sdk`, `dotenv`. No framework yet — Next.js is introduced in Plan 2.

## Global Constraints

- Supermemory Local runs at `http://localhost:6767` (per spec Section 7).
- Auth: `Authorization: Bearer $SUPERMEMORY_API_KEY` on every request.
- Write memories via `POST /v3/documents`; search via `POST /v4/search` (hybrid mode); profile via `POST /v4/profile`.
- Every read/write must be scoped with `containerTag` (spec Section 2, isolation requirement).
- Character sheets are static and injected into every Claude call, never searched; ground-truth and dynamic memories are atomic documents, never one large blob (spec Section 4).
- LLM is Claude via the Anthropic SDK (spec Section 7).
- Model id: `claude-sonnet-5`.

---

### Task 1: Project scaffolding

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `.env.example`
- Create: `.gitignore`
- Test: `test/smoke.test.ts`

**Interfaces:**
- Consumes: nothing (first task).
- Produces: a working `npm test` command and TypeScript toolchain that every later task relies on.

- [ ] **Step 1: Write `package.json`**

```json
{
  "name": "alibi",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit",
    "dev-interrogate": "tsx scripts/dev-interrogate.ts"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.32.0",
    "dotenv": "^16.4.5"
  },
  "devDependencies": {
    "@types/node": "^20.14.0",
    "tsx": "^4.16.2",
    "typescript": "^5.5.4",
    "vitest": "^2.0.5"
  }
}
```

- [ ] **Step 2: Write `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "types": ["node"]
  },
  "include": ["lib", "scripts", "test"]
}
```

- [ ] **Step 3: Write `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node'
  }
})
```

- [ ] **Step 4: Write `.env.example`**

```
SUPERMEMORY_BASE_URL=http://localhost:6767
SUPERMEMORY_API_KEY=replace-with-key-from-first-boot
ANTHROPIC_API_KEY=replace-with-your-key
```

- [ ] **Step 5: Write `.gitignore`**

```
node_modules/
dist/
.env
```

- [ ] **Step 6: Install dependencies**

Run: `npm install`
Expected: installs successfully, creates `node_modules/` and `package-lock.json`.

- [ ] **Step 7: Write the failing smoke test**

```ts
// test/smoke.test.ts
import { describe, expect, it } from 'vitest'

describe('toolchain smoke test', () => {
  it('runs a basic assertion', () => {
    expect(1 + 1).toBe(2)
  })
})
```

- [ ] **Step 8: Run the test to verify the toolchain works**

Run: `npm test`
Expected: PASS — 1 test passed.

- [ ] **Step 9: Commit**

```bash
git add package.json tsconfig.json vitest.config.ts .env.example .gitignore test/smoke.test.ts package-lock.json
git commit -m "chore: scaffold TypeScript/Vitest project for Alibi"
```

---

### Task 2: Supermemory HTTP client

**Files:**
- Create: `lib/supermemory/types.ts`
- Create: `lib/supermemory/client.ts`
- Test: `lib/supermemory/client.test.ts`

**Interfaces:**
- Consumes: nothing beyond the toolchain from Task 1.
- Produces: `SupermemoryClient` interface (`writeMemory`, `search`, `getProfile`) and `HttpSupermemoryClient` implementing it. Later tasks depend on the exact method signatures:
  - `writeMemory(params: WriteMemoryParams): Promise<WriteMemoryResult>`
  - `search(params: SearchParams): Promise<SearchResult>`
  - `getProfile(params: ProfileParams): Promise<ProfileResult>`

- [ ] **Step 1: Write the failing test**

```ts
// lib/supermemory/client.test.ts
import { describe, expect, it, vi } from 'vitest'
import { HttpSupermemoryClient } from './client.js'

function fakeFetch(responseBody: unknown, ok = true, status = 200) {
  return vi.fn().mockResolvedValue({
    ok,
    status,
    json: async () => responseBody,
    text: async () => JSON.stringify(responseBody)
  }) as unknown as typeof fetch
}

describe('HttpSupermemoryClient', () => {
  it('writes a memory via POST /v3/documents', async () => {
    const fetchImpl = fakeFetch({ id: 'mem_1', status: 'queued' })
    const client = new HttpSupermemoryClient({
      baseUrl: 'http://localhost:6767',
      apiKey: 'test-key',
      fetchImpl
    })

    const result = await client.writeMemory({
      content: 'Saw Ivo near the docks at 22:00',
      containerTag: 'suspect-mara',
      metadata: { source: 'ground-truth' }
    })

    expect(result).toEqual({ id: 'mem_1', status: 'queued' })
    expect(fetchImpl).toHaveBeenCalledWith(
      'http://localhost:6767/v3/documents',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-key',
          'Content-Type': 'application/json'
        })
      })
    )

    const call = (fetchImpl as ReturnType<typeof vi.fn>).mock.calls[0]
    const init = call[1] as { body: string }
    expect(JSON.parse(init.body)).toEqual({
      content: 'Saw Ivo near the docks at 22:00',
      containerTag: 'suspect-mara',
      metadata: { source: 'ground-truth' }
    })
  })

  it('searches via POST /v4/search', async () => {
    const fetchImpl = fakeFetch({
      results: [{ id: 'mem_1', content: 'Saw Ivo near the docks at 22:00' }]
    })
    const client = new HttpSupermemoryClient({
      baseUrl: 'http://localhost:6767',
      apiKey: 'test-key',
      fetchImpl
    })

    const result = await client.search({
      q: 'Where was Ivo at 22:00?',
      containerTag: 'suspect-mara',
      searchMode: 'hybrid'
    })

    expect(result.results).toHaveLength(1)
    expect(result.results[0].content).toBe('Saw Ivo near the docks at 22:00')
    expect(fetchImpl).toHaveBeenCalledWith(
      'http://localhost:6767/v4/search',
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('fetches a profile via POST /v4/profile', async () => {
    const fetchImpl = fakeFetch({ profile: { trust: 'low' } })
    const client = new HttpSupermemoryClient({
      baseUrl: 'http://localhost:6767',
      apiKey: 'test-key',
      fetchImpl
    })

    const result = await client.getProfile({ containerTag: 'suspect-mara' })

    expect(result.profile).toEqual({ trust: 'low' })
  })

  it('throws when the response is not ok', async () => {
    const fetchImpl = fakeFetch({ error: 'bad request' }, false, 400)
    const client = new HttpSupermemoryClient({
      baseUrl: 'http://localhost:6767',
      apiKey: 'test-key',
      fetchImpl
    })

    await expect(
      client.search({ q: 'x', containerTag: 'suspect-mara' })
    ).rejects.toThrow('Supermemory request to /v4/search failed: 400')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL — `lib/supermemory/client.ts` does not exist / `HttpSupermemoryClient` is not defined.

- [ ] **Step 3: Write `lib/supermemory/types.ts`**

```ts
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
```

- [ ] **Step 4: Write `lib/supermemory/client.ts`**

```ts
import type {
  ProfileParams,
  ProfileResult,
  SearchParams,
  SearchResult,
  SupermemoryClient,
  WriteMemoryParams,
  WriteMemoryResult
} from './types.js'

export interface HttpSupermemoryClientConfig {
  baseUrl: string
  apiKey: string
  fetchImpl?: typeof fetch
}

export class HttpSupermemoryClient implements SupermemoryClient {
  private baseUrl: string
  private apiKey: string
  private fetchImpl: typeof fetch

  constructor(config: HttpSupermemoryClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '')
    this.apiKey = config.apiKey
    this.fetchImpl = config.fetchImpl ?? fetch
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`Supermemory request to ${path} failed: ${response.status} ${text}`)
    }

    return (await response.json()) as T
  }

  async writeMemory(params: WriteMemoryParams): Promise<WriteMemoryResult> {
    return this.post<WriteMemoryResult>('/v3/documents', params)
  }

  async search(params: SearchParams): Promise<SearchResult> {
    return this.post<SearchResult>('/v4/search', params)
  }

  async getProfile(params: ProfileParams): Promise<ProfileResult> {
    return this.post<ProfileResult>('/v4/profile', params)
  }
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm test`
Expected: PASS — 4 new tests pass (plus the smoke test).

- [ ] **Step 6: Typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add lib/supermemory/types.ts lib/supermemory/client.ts lib/supermemory/client.test.ts
git commit -m "feat: add Supermemory Local HTTP client"
```

---

### Task 3: In-memory fake client + suspect memory writes

**Files:**
- Create: `lib/supermemory/fakeClient.ts`
- Create: `lib/suspect/memory.ts`
- Test: `lib/suspect/memory.test.ts`

**Interfaces:**
- Consumes: `SupermemoryClient` interface from Task 2 (`lib/supermemory/types.ts`).
- Produces:
  - `FakeSupermemoryClient` (implements `SupermemoryClient`, in-memory, container-scoped) — used by all later tests, including Task 5's composed integration test.
  - `seedGroundTruth(containerTag: string, facts: string[], client: SupermemoryClient): Promise<void>`
  - `tellSuspect(containerTag: string, content: string, source: StatementSource, client: SupermemoryClient): Promise<void>` where `StatementSource = 'player-told' | 'evidence-shown'`.

- [ ] **Step 1: Write the failing test**

```ts
// lib/suspect/memory.test.ts
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL — `lib/supermemory/fakeClient.ts` and `lib/suspect/memory.ts` do not exist.

- [ ] **Step 3: Write `lib/supermemory/fakeClient.ts`**

```ts
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
```

- [ ] **Step 4: Write `lib/suspect/memory.ts`**

```ts
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
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm test`
Expected: PASS — all tests pass, including the 3 new ones.

- [ ] **Step 6: Typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add lib/supermemory/fakeClient.ts lib/suspect/memory.ts lib/suspect/memory.test.ts
git commit -m "feat: add fake Supermemory client and suspect memory writes"
```

---

### Task 4: Claude client + grounded suspect responses

**Files:**
- Create: `lib/anthropic/types.ts`
- Create: `lib/anthropic/client.ts`
- Create: `lib/anthropic/fakeClient.ts`
- Create: `lib/suspect/respond.ts`
- Test: `lib/suspect/respond.test.ts`

**Interfaces:**
- Consumes: `SupermemoryClient` (Task 2), `FakeSupermemoryClient` (Task 3).
- Produces:
  - `AnthropicClientLike` interface with `createMessage(params: AnthropicMessageParams): Promise<string>`.
  - `ClaudeClient` (real, wraps `@anthropic-ai/sdk`) and `FakeAnthropicClient` (records calls, returns a caller-supplied response) both implementing it.
  - `CharacterSheet` type: `{ suspectId, containerTag, name, voice, motive, hiddenFacts }`.
  - `respondAsSuspect(characterSheet: CharacterSheet, question: string, deps: { supermemory: SupermemoryClient; anthropic: AnthropicClientLike }): Promise<RespondResult>` where `RespondResult = { answer: string; query: string; retrievedMemories: RetrievedMemory[] }` and `RetrievedMemory = { id: string; content: string }`. Task 5 depends on this exact signature.

- [ ] **Step 1: Write the failing test**

```ts
// lib/suspect/respond.test.ts
import { describe, expect, it } from 'vitest'
import { FakeSupermemoryClient } from '../supermemory/fakeClient.js'
import { FakeAnthropicClient } from '../anthropic/fakeClient.js'
import { seedGroundTruth } from './memory.js'
import { respondAsSuspect, type CharacterSheet } from './respond.js'

const mara: CharacterSheet = {
  suspectId: 'mara',
  containerTag: 'suspect-mara',
  name: 'Mara Okafor',
  voice: 'clipped, professional, deflects with procedure',
  motive: "covering up the reroute she made at 21:45",
  hiddenFacts: "She edited the dispatch log to reroute Theo at 21:45."
}

describe('respondAsSuspect', () => {
  it('grounds the answer in retrieved memories and the character sheet', async () => {
    const supermemory = new FakeSupermemoryClient()
    const anthropic = new FakeAnthropicClient((params) => `RESPONSE_USING: ${params.userMessage}`)

    await seedGroundTruth(
      mara.containerTag,
      ['Rerouted Theo\'s delivery path at 21:45, logged internally as "traffic".'],
      supermemory
    )

    const result = await respondAsSuspect(mara, "Did you change Theo's route?", {
      supermemory,
      anthropic
    })

    expect(result.query).toBe("Did you change Theo's route?")
    expect(result.retrievedMemories).toHaveLength(1)
    expect(result.retrievedMemories[0].content).toContain('Rerouted')
    expect(result.answer).toContain('Rerouted')

    expect(anthropic.calls).toHaveLength(1)
    expect(anthropic.calls[0].system).toContain('Mara Okafor')
    expect(anthropic.calls[0].system).toContain(mara.hiddenFacts)
    expect(anthropic.calls[0].userMessage).toContain('Rerouted')
  })

  it('tells the model when nothing relevant was found, instead of inventing facts', async () => {
    const supermemory = new FakeSupermemoryClient()
    const anthropic = new FakeAnthropicClient((params) => `RESPONSE_USING: ${params.userMessage}`)

    const result = await respondAsSuspect(mara, 'What is the capital of France?', {
      supermemory,
      anthropic
    })

    expect(result.retrievedMemories).toHaveLength(0)
    expect(anthropic.calls[0].userMessage).toContain('no relevant memories found')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL — `lib/anthropic/fakeClient.ts` and `lib/suspect/respond.ts` do not exist.

- [ ] **Step 3: Write `lib/anthropic/types.ts`**

```ts
export interface AnthropicMessageParams {
  system: string
  userMessage: string
}

export interface AnthropicClientLike {
  createMessage(params: AnthropicMessageParams): Promise<string>
}
```

- [ ] **Step 4: Write `lib/anthropic/client.ts`**

```ts
import Anthropic from '@anthropic-ai/sdk'
import type { AnthropicClientLike, AnthropicMessageParams } from './types.js'

export class ClaudeClient implements AnthropicClientLike {
  private client: Anthropic
  private model: string

  constructor(apiKey: string, model = 'claude-sonnet-5') {
    this.client = new Anthropic({ apiKey })
    this.model = model
  }

  async createMessage(params: AnthropicMessageParams): Promise<string> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 500,
      system: params.system,
      messages: [{ role: 'user', content: params.userMessage }]
    })

    const textBlock = response.content.find((block) => block.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('Claude response contained no text block')
    }
    return textBlock.text
  }
}
```

- [ ] **Step 5: Write `lib/anthropic/fakeClient.ts`**

```ts
import type { AnthropicClientLike, AnthropicMessageParams } from './types.js'

export class FakeAnthropicClient implements AnthropicClientLike {
  public calls: AnthropicMessageParams[] = []

  constructor(private responder: (params: AnthropicMessageParams) => string) {}

  async createMessage(params: AnthropicMessageParams): Promise<string> {
    this.calls.push(params)
    return this.responder(params)
  }
}
```

- [ ] **Step 6: Write `lib/suspect/respond.ts`**

```ts
import type { SupermemoryClient } from '../supermemory/types.js'
import type { AnthropicClientLike } from '../anthropic/types.js'

export interface CharacterSheet {
  suspectId: string
  containerTag: string
  name: string
  voice: string
  motive: string
  hiddenFacts: string
}

export interface RetrievedMemory {
  id: string
  content: string
}

export interface RespondResult {
  answer: string
  query: string
  retrievedMemories: RetrievedMemory[]
}

function buildSystemPrompt(sheet: CharacterSheet): string {
  return [
    `You are ${sheet.name}, a suspect being interrogated by a detective.`,
    `Voice: ${sheet.voice}`,
    `Motive: ${sheet.motive}`,
    `What you're hiding: ${sheet.hiddenFacts}`,
    'Only answer using the memories provided below. If nothing relevant is provided, say you genuinely do not know or remember - do not invent facts.'
  ].join('\n')
}

function buildUserMessage(question: string, memories: RetrievedMemory[]): string {
  const memoryBlock =
    memories.length > 0
      ? memories.map((memory) => `- ${memory.content}`).join('\n')
      : '(no relevant memories found)'
  return `Your memories relevant to this question:\n${memoryBlock}\n\nThe detective asks: "${question}"`
}

export async function respondAsSuspect(
  characterSheet: CharacterSheet,
  question: string,
  deps: { supermemory: SupermemoryClient; anthropic: AnthropicClientLike }
): Promise<RespondResult> {
  const searchResult = await deps.supermemory.search({
    q: question,
    containerTag: characterSheet.containerTag,
    searchMode: 'hybrid'
  })

  const retrievedMemories: RetrievedMemory[] = searchResult.results.map((item) => ({
    id: item.id,
    content: item.content
  }))

  const answer = await deps.anthropic.createMessage({
    system: buildSystemPrompt(characterSheet),
    userMessage: buildUserMessage(question, retrievedMemories)
  })

  return { answer, query: question, retrievedMemories }
}
```

- [ ] **Step 7: Run the test to verify it passes**

Run: `npm test`
Expected: PASS — all tests pass, including the 2 new ones.

- [ ] **Step 8: Typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 9: Commit**

```bash
git add lib/anthropic/types.ts lib/anthropic/client.ts lib/anthropic/fakeClient.ts lib/suspect/respond.ts lib/suspect/respond.test.ts
git commit -m "feat: add Claude client and grounded suspect response generation"
```

---

### Task 5: Composed loop proof + manual CLI harness

**Files:**
- Test: `test/suspect-loop.test.ts`
- Create: `scripts/dev-interrogate.ts`

**Interfaces:**
- Consumes: everything from Tasks 2-4 (`FakeSupermemoryClient`, `FakeAnthropicClient`, `HttpSupermemoryClient`, `ClaudeClient`, `seedGroundTruth`, `tellSuspect`, `respondAsSuspect`).
- Produces: an automated proof of the plan's three "done when" criteria (grounded answers, lie persistence, suspect isolation), and a manual script for verifying the same against the real local Supermemory server and real Claude before demo recording.

- [ ] **Step 1: Write the composed integration test**

This test exercises already-implemented units together — it is expected to pass immediately if Tasks 2-4 are correct. A failure here means a composition mismatch between those units, not new functionality.

```ts
// test/suspect-loop.test.ts
import { describe, expect, it } from 'vitest'
import { FakeSupermemoryClient } from '../lib/supermemory/fakeClient.js'
import { FakeAnthropicClient } from '../lib/anthropic/fakeClient.js'
import { seedGroundTruth, tellSuspect } from '../lib/suspect/memory.js'
import { respondAsSuspect, type CharacterSheet } from '../lib/suspect/respond.js'

const mara: CharacterSheet = {
  suspectId: 'mara',
  containerTag: 'case1-suspect-mara',
  name: 'Mara Okafor',
  voice: 'clipped, professional, deflects with procedure',
  motive: 'covering up the reroute she made at 21:45',
  hiddenFacts: 'She edited the dispatch log to reroute Theo at 21:45.'
}

const jonas: CharacterSheet = {
  suspectId: 'jonas',
  containerTag: 'case1-suspect-jonas',
  name: 'Jonas Marsh',
  voice: 'nervous, over-explains',
  motive: 'hiding that he was at the docks to meet Theo for money',
  hiddenFacts: 'He was at the docks at 22:00, not home.'
}

function echoResponder() {
  return (params: { userMessage: string }) => `RESPONSE_USING: ${params.userMessage}`
}

describe('suspect memory loop (composed)', () => {
  it('answers using seeded ground truth', async () => {
    const supermemory = new FakeSupermemoryClient()
    const anthropic = new FakeAnthropicClient(echoResponder())

    await seedGroundTruth(
      mara.containerTag,
      ['Rerouted Theo\'s delivery path at 21:45, logged internally as "traffic".'],
      supermemory
    )

    const result = await respondAsSuspect(mara, "Did you change Theo's route?", {
      supermemory,
      anthropic
    })

    expect(result.retrievedMemories).toHaveLength(1)
    expect(result.answer).toContain('Rerouted')
  })

  it('remembers a planted lie on the next question', async () => {
    const supermemory = new FakeSupermemoryClient()
    const anthropic = new FakeAnthropicClient(echoResponder())

    await seedGroundTruth(mara.containerTag, ['Was at the dispatch desk all night.'], supermemory)

    await tellSuspect(
      mara.containerTag,
      'The detective told you: "Jonas already confessed he was at the docks."',
      'player-told',
      supermemory
    )

    const result = await respondAsSuspect(mara, 'What do you know about Jonas and the docks?', {
      supermemory,
      anthropic
    })

    const contents = result.retrievedMemories.map((memory) => memory.content)
    expect(contents.some((content) => content.includes('Jonas already confessed'))).toBe(true)
  })

  it("keeps suspects isolated from each other's memories", async () => {
    const supermemory = new FakeSupermemoryClient()
    const anthropic = new FakeAnthropicClient(echoResponder())

    await seedGroundTruth(
      jonas.containerTag,
      ['Was at the docks at 22:00 to meet Theo for money.'],
      supermemory
    )

    const result = await respondAsSuspect(mara, 'Where was Jonas at 22:00?', {
      supermemory,
      anthropic
    })

    expect(result.retrievedMemories).toHaveLength(0)
  })
})
```

- [ ] **Step 2: Run the test to verify it passes**

Run: `npm test`
Expected: PASS — all tests across the project pass, including these 3.

- [ ] **Step 3: Write the manual CLI harness**

```ts
// scripts/dev-interrogate.ts
import 'dotenv/config'
import { HttpSupermemoryClient } from '../lib/supermemory/client.js'
import { ClaudeClient } from '../lib/anthropic/client.js'
import { seedGroundTruth, tellSuspect } from '../lib/suspect/memory.js'
import { respondAsSuspect, type CharacterSheet } from '../lib/suspect/respond.js'

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required env var: ${name}`)
  }
  return value
}

async function main(): Promise<void> {
  const supermemory = new HttpSupermemoryClient({
    baseUrl: requireEnv('SUPERMEMORY_BASE_URL'),
    apiKey: requireEnv('SUPERMEMORY_API_KEY')
  })
  const anthropic = new ClaudeClient(requireEnv('ANTHROPIC_API_KEY'))

  const mara: CharacterSheet = {
    suspectId: 'mara',
    containerTag: 'dev-suspect-mara',
    name: 'Mara Okafor',
    voice: 'clipped, professional, deflects with procedure',
    motive: 'covering up the reroute she made at 21:45',
    hiddenFacts: 'She edited the dispatch log to reroute Theo at 21:45.'
  }

  await seedGroundTruth(
    mara.containerTag,
    ['Rerouted Theo\'s delivery path at 21:45, logged internally as "traffic".'],
    supermemory
  )

  const first = await respondAsSuspect(mara, "Did you change Theo's route that night?", {
    supermemory,
    anthropic
  })
  console.log('--- First answer ---')
  console.log(first.answer)
  console.log('Retrieved memories:', first.retrievedMemories)

  await tellSuspect(
    mara.containerTag,
    'The detective told you: "We found a witness who says you were seen leaving early."',
    'player-told',
    supermemory
  )

  const second = await respondAsSuspect(mara, 'Were you seen leaving early?', {
    supermemory,
    anthropic
  })
  console.log('--- Second answer, after a planted claim ---')
  console.log(second.answer)
  console.log('Retrieved memories:', second.retrievedMemories)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
```

- [ ] **Step 4: Typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 5: Manually verify against the real local Supermemory server**

This step requires Supermemory Local running (`npx supermemory local` or equivalent, per the self-hosting quickstart) and real `SUPERMEMORY_API_KEY`/`ANTHROPIC_API_KEY` values in a local `.env` file (not committed).

Run: `npm run dev-interrogate`
Expected: prints a first answer that references the reroute (grounded in the seeded memory), then prints a second answer that references being "seen leaving early" (grounded in the planted claim) — confirming live write-then-read against the real server, not just the fake.

- [ ] **Step 6: Commit**

```bash
git add test/suspect-loop.test.ts scripts/dev-interrogate.ts
git commit -m "feat: prove composed suspect memory loop and add manual interrogation harness"
```

---

## Plan self-review notes

- **Spec coverage:** isolation (Task 5, isolation test) — covered. Live write + live read (Task 5, lie-persistence test and manual harness) — covered. Mutable belief / lie planting (`tellSuspect`, Task 3 and 5) — covered. Static character sheet vs. searched atomic memories (Task 4's `buildSystemPrompt`/`buildUserMessage` split) — covered. Claude as the LLM (Task 4) — covered. `/v4/profile` is implemented on the client (Task 2) but not yet consumed by suspect logic — that's intentional; profile-diff display is Plan 3 (interrogation UI) per the 6-plan breakdown, not this plan.
- **Placeholder scan:** no TBD/TODO; every step has complete code.
- **Type consistency:** `RespondResult`, `CharacterSheet`, `RetrievedMemory` defined once in Task 4 and reused verbatim in Task 5; `SupermemoryClient`/`AnthropicClientLike` defined once each and implemented consistently by real and fake clients.
- **Scope:** this plan only covers the backend memory loop, matching Plan 1 from the 6-plan breakdown; UI, movement, evidence, case board, and case content are separate plans.
