// Per-suspect interrogation transcripts, persisted for the browser session in a
// plain module Map. Lives in its own module (not the page file) because Next
// route files may only export a component + route config — no arbitrary named
// exports. Switching suspects and back resumes the saved conversation.

export interface RetrievedMemory {
  id: string
  content: string
}

export interface Turn {
  id: number
  question: string
  answer: string
  query: string
  retrievedMemories: RetrievedMemory[]
}

const transcriptStore = new Map<string, Turn[]>()

export function getTranscript(suspectId: string): Turn[] {
  return transcriptStore.get(suspectId) ?? []
}

export function setTranscript(suspectId: string, turns: Turn[]): void {
  transcriptStore.set(suspectId, turns)
}

/** Test-only: clear all persisted transcripts between cases. */
export function clearTranscripts(): void {
  transcriptStore.clear()
}
