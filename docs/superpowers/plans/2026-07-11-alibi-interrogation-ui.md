# Alibi — Interrogation UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire Plan 1's backend (Supermemory + Claude grounded suspect responses) to a real screen for one suspect, including a memory-trace panel that shows the actual retrieved memories behind each answer — the first point in the project where a real, grounded, Supermemory-backed answer appears on screen instead of in a test or a CLI script.

**Architecture:** Plan 1's `lib/supermemory`/`lib/anthropic`/`lib/suspect` modules hold real API keys and must never reach the browser. A Next.js Route Handler (`app/api/interrogate/route.ts`) is the server boundary: it's a thin adapter around a pure, fully-testable `handleInterrogateRequest` function that does the real work (look up a suspect, call `respondAsSuspect`, shape the response). The client-side interrogation page talks to that route only via `fetch` — it never imports `lib/supermemory` or `lib/anthropic` directly. Two small presentational components (`DialogueBox` for a typewriter reveal, `MemoryTracePanel` for the retrieved-memory display) are built and tested in isolation, then composed into the page.

**Tech Stack:** Next.js App Router Route Handlers, React 18, TypeScript, Vitest with `@vitest-environment jsdom` per-file overrides, `@testing-library/react`. Builds on Plan 1's `lib/supermemory`, `lib/anthropic`, `lib/suspect` (unchanged) and Plan 2's Next.js toolchain (unchanged).

## Global Constraints

- `lib/supermemory` and `lib/anthropic` (which hold API keys via env vars) must only be imported from server-side code (Route Handlers, non-`'use client'` modules) — never from a `'use client'` component. The interrogation page reaches the backend exclusively through `fetch('/api/interrogate', ...)`.
- The Route Handler itself stays a thin adapter with no automated test of its own (consistent with `app/station/page.tsx` and `scripts/dev-interrogate.ts` in prior plans) — all real logic lives in a plain, dependency-injected function that IS tested.
- `respondAsSuspect`'s existing signature (`CharacterSheet`, `RespondResult` with `{ answer, query, retrievedMemories }`) from Plan 1 is reused verbatim — no changes to `lib/suspect/respond.ts`.
- Character content used here (a single `mara` entry in a new registry) is explicitly placeholder — full case content is a later plan. Do not expand this into full case data; that's out of scope here.
- All new relative imports use explicit `.js` extensions, matching the project-wide convention.
- No global vitest environment change — component/page tests opt into `jsdom` per-file via `// @vitest-environment jsdom`.

---

### Task 1: Interrogation API route (server boundary)

**Files:**
- Create: `lib/suspect/registry.ts`
- Create: `lib/interrogate/handleInterrogateRequest.ts`
- Create: `app/api/interrogate/route.ts`
- Test: `lib/interrogate/handleInterrogateRequest.test.ts`

**Interfaces:**
- Consumes: `CharacterSheet`, `respondAsSuspect` (Plan 1, `lib/suspect/respond.ts`), `SupermemoryClient` (Plan 1, `lib/supermemory/types.ts`), `AnthropicClientLike` (Plan 1, `lib/anthropic/types.ts`), `HttpSupermemoryClient` (Plan 1, `lib/supermemory/client.ts`), `ClaudeClient` (Plan 1, `lib/anthropic/client.ts`).
- Produces:
  - `suspects: Record<string, CharacterSheet>` (`lib/suspect/registry.ts`)
  - `handleInterrogateRequest(body: unknown, deps: { supermemory: SupermemoryClient; anthropic: AnthropicClientLike; suspects: Record<string, CharacterSheet> }): Promise<{ status: number; body: Record<string, unknown> }>`
  - `POST` handler exported from `app/api/interrogate/route.ts`, accepting a `Request` with JSON body `{ suspectId: string; question: string }` and returning a JSON `Response`. Task 3's page depends on this exact request/response shape.

- [ ] **Step 1: Write the failing test**

```ts
// lib/interrogate/handleInterrogateRequest.test.ts
import { describe, expect, it } from 'vitest'
import { FakeSupermemoryClient } from '../supermemory/fakeClient.js'
import { FakeAnthropicClient } from '../anthropic/fakeClient.js'
import { seedGroundTruth } from '../suspect/memory.js'
import { handleInterrogateRequest } from './handleInterrogateRequest.js'
import type { CharacterSheet } from '../suspect/respond.js'

const mara: CharacterSheet = {
  suspectId: 'mara',
  containerTag: 'suspect-mara',
  name: 'Mara Okafor',
  voice: 'clipped, professional, deflects with procedure',
  motive: 'covering up the reroute she made at 21:45',
  hiddenFacts: 'She edited the dispatch log to reroute Theo at 21:45.'
}

function echoResponder() {
  return (params: { userMessage: string }) => `RESPONSE_USING: ${params.userMessage}`
}

describe('handleInterrogateRequest', () => {
  it('returns a grounded answer for a known suspect', async () => {
    const supermemory = new FakeSupermemoryClient()
    const anthropic = new FakeAnthropicClient(echoResponder())
    await seedGroundTruth(mara.containerTag, ['Rerouted Theo at 21:45.'], supermemory)

    const result = await handleInterrogateRequest(
      { suspectId: 'mara', question: "Did you change Theo's route?" },
      { supermemory, anthropic, suspects: { mara } }
    )

    expect(result.status).toBe(200)
    expect(result.body.answer).toContain('Rerouted')
    expect(result.body.query).toBe("Did you change Theo's route?")
    expect(Array.isArray(result.body.retrievedMemories)).toBe(true)
  })

  it('returns 404 for an unknown suspect', async () => {
    const supermemory = new FakeSupermemoryClient()
    const anthropic = new FakeAnthropicClient(echoResponder())

    const result = await handleInterrogateRequest(
      { suspectId: 'nobody', question: 'Where were you?' },
      { supermemory, anthropic, suspects: { mara } }
    )

    expect(result.status).toBe(404)
    expect(result.body.error).toBe('Unknown suspect: nobody')
  })

  it('returns 400 when the question is missing', async () => {
    const supermemory = new FakeSupermemoryClient()
    const anthropic = new FakeAnthropicClient(echoResponder())

    const result = await handleInterrogateRequest(
      { suspectId: 'mara' },
      { supermemory, anthropic, suspects: { mara } }
    )

    expect(result.status).toBe(400)
    expect(result.body.error).toBe('Missing or invalid "question"')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL — `lib/interrogate/handleInterrogateRequest.ts` does not exist.

- [ ] **Step 3: Write `lib/suspect/registry.ts`**

```ts
import type { CharacterSheet } from './respond.js'

// Placeholder content for Plan 3 (interrogation UI plumbing) only. A later
// plan replaces this with the full Case 1 cast and ground-truth data.
export const suspects: Record<string, CharacterSheet> = {
  mara: {
    suspectId: 'mara',
    containerTag: 'suspect-mara',
    name: 'Mara Okafor',
    voice: 'clipped, professional, deflects with procedure',
    motive: 'covering up the reroute she made at 21:45',
    hiddenFacts: 'She edited the dispatch log to reroute Theo at 21:45.'
  }
}
```

- [ ] **Step 4: Write `lib/interrogate/handleInterrogateRequest.ts`**

```ts
import type { SupermemoryClient } from '../supermemory/types.js'
import type { AnthropicClientLike } from '../anthropic/types.js'
import type { CharacterSheet } from '../suspect/respond.js'
import { respondAsSuspect } from '../suspect/respond.js'

export interface InterrogateDeps {
  supermemory: SupermemoryClient
  anthropic: AnthropicClientLike
  suspects: Record<string, CharacterSheet>
}

export interface InterrogateResult {
  status: number
  body: Record<string, unknown>
}

function isValidBody(body: unknown): body is { suspectId: string; question: string } {
  if (typeof body !== 'object' || body === null) {
    return false
  }
  const candidate = body as Record<string, unknown>
  return typeof candidate.suspectId === 'string'
}

export async function handleInterrogateRequest(
  body: unknown,
  deps: InterrogateDeps
): Promise<InterrogateResult> {
  if (!isValidBody(body)) {
    return { status: 400, body: { error: 'Missing or invalid "suspectId"' } }
  }

  const { suspectId, question } = body as { suspectId: string; question: unknown }

  if (typeof question !== 'string' || question.trim().length === 0) {
    return { status: 400, body: { error: 'Missing or invalid "question"' } }
  }

  const characterSheet = deps.suspects[suspectId]
  if (!characterSheet) {
    return { status: 404, body: { error: `Unknown suspect: ${suspectId}` } }
  }

  const result = await respondAsSuspect(characterSheet, question, {
    supermemory: deps.supermemory,
    anthropic: deps.anthropic
  })

  return {
    status: 200,
    body: {
      answer: result.answer,
      query: result.query,
      retrievedMemories: result.retrievedMemories
    }
  }
}
```

- [ ] **Step 5: Write `app/api/interrogate/route.ts`**

```ts
import { HttpSupermemoryClient } from '../../../lib/supermemory/client.js'
import { ClaudeClient } from '../../../lib/anthropic/client.js'
import { suspects } from '../../../lib/suspect/registry.js'
import { handleInterrogateRequest } from '../../../lib/interrogate/handleInterrogateRequest.js'

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required env var: ${name}`)
  }
  return value
}

export async function POST(request: Request): Promise<Response> {
  const body = await request.json()

  const supermemory = new HttpSupermemoryClient({
    baseUrl: requireEnv('SUPERMEMORY_BASE_URL'),
    apiKey: requireEnv('SUPERMEMORY_API_KEY')
  })
  const anthropic = new ClaudeClient(requireEnv('ANTHROPIC_API_KEY'))

  const result = await handleInterrogateRequest(body, { supermemory, anthropic, suspects })

  return Response.json(result.body, { status: result.status })
}
```

No automated test is added for `app/api/interrogate/route.ts` itself — it has no logic of its own beyond constructing real clients from env vars and delegating to `handleInterrogateRequest`, which is fully covered by Step 1's test. Constructing real `HttpSupermemoryClient`/`ClaudeClient` requires real env vars and a live server, which is exactly the kind of thing Plan 1's `scripts/dev-interrogate.ts` manual step already verifies against.

- [ ] **Step 6: Run the test to verify it passes**

Run: `npm test`
Expected: PASS — all 28 tests pass (25 from Plans 1-2 + 3 new).

- [ ] **Step 7: Typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add lib/suspect/registry.ts lib/interrogate/handleInterrogateRequest.ts lib/interrogate/handleInterrogateRequest.test.ts app/api/interrogate/route.ts
git commit -m "feat: add interrogation API route with a testable request handler"
```

---

### Task 2: Presentational components — DialogueBox and MemoryTracePanel

**Files:**
- Create: `components/interrogation/DialogueBox.tsx`
- Create: `components/interrogation/MemoryTracePanel.tsx`
- Test: `components/interrogation/DialogueBox.test.tsx`
- Test: `components/interrogation/MemoryTracePanel.test.tsx`

**Interfaces:**
- Consumes: nothing from Task 1 — these are pure presentational components.
- Produces:
  - `DialogueBox` component, props `{ text: string; charactersPerTick?: number; tickMs?: number }`, rendering a `data-testid="dialogue-box"` element with a `data-full-text` attribute always equal to the full `text` prop (independent of animation progress) and visible content that reveals progressively.
  - `MemoryTracePanel` component, props `{ query: string; retrievedMemories: Array<{ id: string; content: string }> }`, rendering a `data-testid="memory-trace-panel"` element. Task 3 depends on both components' exact prop shapes and testids.

- [ ] **Step 1: Write the failing tests**

```tsx
// components/interrogation/DialogueBox.test.tsx
// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { DialogueBox } from './DialogueBox.js'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('DialogueBox', () => {
  it('reveals text progressively over time', () => {
    render(<DialogueBox text="Hi" tickMs={20} charactersPerTick={1} />)

    expect(screen.getByTestId('dialogue-box').textContent).toBe('')

    vi.advanceTimersByTime(20)
    expect(screen.getByTestId('dialogue-box').textContent).toBe('H')

    vi.advanceTimersByTime(20)
    expect(screen.getByTestId('dialogue-box').textContent).toBe('Hi')

    vi.advanceTimersByTime(100)
    expect(screen.getByTestId('dialogue-box').textContent).toBe('Hi')
  })

  it('exposes the full text via data-full-text regardless of reveal progress', () => {
    render(<DialogueBox text="Hi" tickMs={20} charactersPerTick={1} />)

    expect(screen.getByTestId('dialogue-box').getAttribute('data-full-text')).toBe('Hi')
  })
})
```

```tsx
// components/interrogation/MemoryTracePanel.test.tsx
// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryTracePanel } from './MemoryTracePanel.js'

afterEach(() => {
  cleanup()
})

describe('MemoryTracePanel', () => {
  it('renders the query and each retrieved memory', () => {
    render(
      <MemoryTracePanel
        query="Did you change the route?"
        retrievedMemories={[
          { id: 'mem_1', content: 'Rerouted Theo at 21:45.' },
          { id: 'mem_2', content: 'Logged it as traffic.' }
        ]}
      />
    )

    expect(screen.getByText(/Did you change the route\?/)).toBeTruthy()
    expect(screen.getByText('Rerouted Theo at 21:45.')).toBeTruthy()
    expect(screen.getByText('Logged it as traffic.')).toBeTruthy()
  })

  it('shows a fallback message when nothing was retrieved', () => {
    render(<MemoryTracePanel query="What is the capital of France?" retrievedMemories={[]} />)

    expect(screen.getByText('No relevant memories found.')).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test`
Expected: FAIL — `components/interrogation/DialogueBox.tsx` and `components/interrogation/MemoryTracePanel.tsx` do not exist.

- [ ] **Step 3: Write `components/interrogation/DialogueBox.tsx`**

```tsx
'use client'

import { useEffect, useState } from 'react'

export interface DialogueBoxProps {
  text: string
  charactersPerTick?: number
  tickMs?: number
}

export function DialogueBox({ text, charactersPerTick = 1, tickMs = 20 }: DialogueBoxProps) {
  const [visibleCount, setVisibleCount] = useState(0)

  useEffect(() => {
    setVisibleCount(0)
    if (text.length === 0) {
      return
    }

    const interval = setInterval(() => {
      setVisibleCount((current) => {
        const next = Math.min(current + charactersPerTick, text.length)
        if (next >= text.length) {
          clearInterval(interval)
        }
        return next
      })
    }, tickMs)

    return () => clearInterval(interval)
  }, [text, charactersPerTick, tickMs])

  return (
    <div data-testid="dialogue-box" data-full-text={text}>
      {text.slice(0, visibleCount)}
    </div>
  )
}
```

- [ ] **Step 4: Write `components/interrogation/MemoryTracePanel.tsx`**

```tsx
export interface MemoryTracePanelMemory {
  id: string
  content: string
}

export interface MemoryTracePanelProps {
  query: string
  retrievedMemories: MemoryTracePanelMemory[]
}

export function MemoryTracePanel({ query, retrievedMemories }: MemoryTracePanelProps) {
  return (
    <aside data-testid="memory-trace-panel">
      <p>Query: {query}</p>
      {retrievedMemories.length === 0 ? (
        <p>No relevant memories found.</p>
      ) : (
        <ul>
          {retrievedMemories.map((memory) => (
            <li key={memory.id}>{memory.content}</li>
          ))}
        </ul>
      )}
    </aside>
  )
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npm test`
Expected: PASS — all 32 tests pass (28 from Task 1 + 4 new).

- [ ] **Step 6: Typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add components/interrogation/DialogueBox.tsx components/interrogation/DialogueBox.test.tsx components/interrogation/MemoryTracePanel.tsx components/interrogation/MemoryTracePanel.test.tsx
git commit -m "feat: add DialogueBox and MemoryTracePanel presentational components"
```

---

### Task 3: Interrogation page

**Files:**
- Create: `app/interrogation/[suspectId]/page.tsx`
- Test: `app/interrogation/[suspectId]/page.test.tsx`

**Interfaces:**
- Consumes: `DialogueBox` (Task 2), `MemoryTracePanel` (Task 2), and the `POST /api/interrogate` JSON contract from Task 1 (`{ suspectId, question }` request, `{ answer, query, retrievedMemories }` or `{ error }` response).
- Produces: `InterrogationPage` default export, a `'use client'` page taking `{ params: { suspectId: string } }`, rendering a question form and, after a successful response, `DialogueBox` + `MemoryTracePanel`.

- [ ] **Step 1: Write the failing test**

```tsx
// app/interrogation/[suspectId]/page.test.tsx
// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import InterrogationPage from './page.js'

function stubFetchOnce(responseBody: unknown, ok = true, status = 200) {
  return vi.fn().mockResolvedValue({
    ok,
    status,
    json: async () => responseBody
  })
}

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('InterrogationPage', () => {
  it('submits a question and renders the grounded answer with its memory trace', async () => {
    const fetchMock = stubFetchOnce({
      answer: 'I rerouted him. It was procedure.',
      query: "Did you change Theo's route?",
      retrievedMemories: [{ id: 'mem_1', content: 'Rerouted Theo at 21:45.' }]
    })
    vi.stubGlobal('fetch', fetchMock)

    render(<InterrogationPage params={{ suspectId: 'mara' }} />)

    fireEvent.change(screen.getByLabelText('Ask a question'), {
      target: { value: "Did you change Theo's route?" }
    })
    fireEvent.submit(screen.getByLabelText('Ask a question').closest('form') as HTMLFormElement)

    await waitFor(() => {
      expect(screen.getByTestId('dialogue-box').getAttribute('data-full-text')).toBe(
        'I rerouted him. It was procedure.'
      )
    })

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/interrogate',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ suspectId: 'mara', question: "Did you change Theo's route?" })
      })
    )
    expect(screen.getByTestId('memory-trace-panel').textContent).toContain(
      'Rerouted Theo at 21:45.'
    )
  })

  it('shows an error message when the request fails', async () => {
    const fetchMock = stubFetchOnce({ error: 'Unknown suspect: mara' }, false, 404)
    vi.stubGlobal('fetch', fetchMock)

    render(<InterrogationPage params={{ suspectId: 'mara' }} />)

    fireEvent.change(screen.getByLabelText('Ask a question'), {
      target: { value: 'Anything?' }
    })
    fireEvent.submit(screen.getByLabelText('Ask a question').closest('form') as HTMLFormElement)

    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toBe('Unknown suspect: mara')
    })
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL — `app/interrogation/[suspectId]/page.tsx` does not exist.

- [ ] **Step 3: Write `app/interrogation/[suspectId]/page.tsx`**

```tsx
'use client'

import { useState, type FormEvent } from 'react'
import { DialogueBox } from '../../../components/interrogation/DialogueBox.js'
import { MemoryTracePanel } from '../../../components/interrogation/MemoryTracePanel.js'

interface RetrievedMemory {
  id: string
  content: string
}

interface InterrogateResponse {
  answer: string
  query: string
  retrievedMemories: RetrievedMemory[]
}

export interface InterrogationPageProps {
  params: { suspectId: string }
}

export default function InterrogationPage({ params }: InterrogationPageProps) {
  const [question, setQuestion] = useState('')
  const [result, setResult] = useState<InterrogateResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/interrogate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suspectId: params.suspectId, question })
      })
      const body = await response.json()

      if (!response.ok) {
        setError(typeof body.error === 'string' ? body.error : 'Something went wrong')
        return
      }

      setResult(body as InterrogateResponse)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main>
      <form onSubmit={handleSubmit}>
        <label htmlFor="question">Ask a question</label>
        <input
          id="question"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Asking...' : 'Ask'}
        </button>
      </form>
      {error && <p role="alert">{error}</p>}
      {result && (
        <>
          <DialogueBox text={result.answer} />
          <MemoryTracePanel query={result.query} retrievedMemories={result.retrievedMemories} />
        </>
      )}
    </main>
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test`
Expected: PASS — all 34 tests pass (32 from Tasks 1-2 + 2 new).

- [ ] **Step 5: Typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add app/interrogation/\[suspectId\]/page.tsx app/interrogation/\[suspectId\]/page.test.tsx
git commit -m "feat: add interrogation page wiring the API route to DialogueBox and MemoryTracePanel"
```

---

## Plan self-review notes

- **Spec coverage:** grounded answers reaching a real screen (Task 3) — covered. Memory-trace panel showing the actual retrieved memories (Task 2 + 3) — covered, matches spec Section 6's stated priority that this panel is "a first-class feature, not a debug overlay." Server boundary keeping API keys server-side (Task 1's route/handler split) — covered, directly addresses the recommendation from Plan 2's final whole-branch review. `/v4/profile` diffs are explicitly NOT built here — that's a later plan, not silently dropped.
- **Placeholder scan:** no TBD/TODO; the one intentional placeholder (`lib/suspect/registry.ts`'s single `mara` entry) is explicitly labeled as such with a comment explaining it's superseded by a later plan, not left ambiguous.
- **Type consistency:** `CharacterSheet` reused verbatim from Plan 1; `InterrogateResult`/`InterrogateDeps` (Task 1) and the `InterrogateResponse` shape consumed in Task 3 agree field-for-field (`answer`, `query`, `retrievedMemories`); `DialogueBoxProps`/`MemoryTracePanelProps` (Task 2) match their usage in Task 3 exactly.
- **Scope:** this plan only covers wiring one suspect's interrogation flow end-to-end; evidence, case board, and full case content remain separate plans (4-6 from the original breakdown).
