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
