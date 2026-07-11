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
