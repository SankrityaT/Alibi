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
    <aside className="memory-trace-panel" data-testid="memory-trace-panel">
      <p className="uppercase-label" style={{ margin: '0 0 0.75rem', color: 'var(--amber)' }}>
        Memory Trace
      </p>
      <p className="memory-trace-query">Query: {query}</p>
      {retrievedMemories.length === 0 ? (
        <p className="memory-trace-empty">No relevant memories found.</p>
      ) : (
        <ul className="memory-trace-list">
          {retrievedMemories.map((memory) => (
            <li key={memory.id}>{memory.content}</li>
          ))}
        </ul>
      )}
    </aside>
  )
}
