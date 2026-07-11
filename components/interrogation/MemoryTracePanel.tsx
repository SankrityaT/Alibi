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
