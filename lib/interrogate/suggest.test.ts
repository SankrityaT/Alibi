import { describe, expect, it, vi } from 'vitest'
import {
  buildSuggestUserMessage,
  parseSuggestedQuestions,
  suggestQuestions
} from './suggest.js'

describe('parseSuggestedQuestions', () => {
  it('extracts a JSON array even with surrounding prose or fences', () => {
    const raw = 'Sure!\n```json\n["Where were you at 10pm?", "Explain the phone call.", "Why lie?"]\n```'
    expect(parseSuggestedQuestions(raw)).toEqual([
      'Where were you at 10pm?',
      'Explain the phone call.',
      'Why lie?'
    ])
  })

  it('caps at three, drops non-strings and blanks', () => {
    const raw = '["a", "", "b", 3, "c", "d"]'
    expect(parseSuggestedQuestions(raw)).toEqual(['a', 'b', 'c'])
  })

  it('returns [] when there is no array', () => {
    expect(parseSuggestedQuestions('no questions here')).toEqual([])
  })
})

describe('suggestQuestions', () => {
  it('sends case + transcript context and returns parsed questions', async () => {
    const createMessage = vi.fn().mockResolvedValue('["Q1?", "Q2?", "Q3?"]')
    const result = await suggestQuestions(
      {
        suspectName: 'Mara',
        crime: 'Theft of the Halcyon diamond',
        synopsis: 'It vanished from the vault during the gala.',
        transcript: [{ question: 'Where were you?', answer: 'The atrium.' }]
      },
      { anthropic: { createMessage } }
    )
    expect(result).toEqual(['Q1?', 'Q2?', 'Q3?'])
    const userMessage = createMessage.mock.calls[0][0].userMessage as string
    expect(userMessage).toContain('Mara')
    expect(userMessage).toContain('Halcyon diamond')
    expect(userMessage).toContain('The atrium.')
  })
})

describe('buildSuggestUserMessage', () => {
  it('keeps only the last few turns', () => {
    const transcript = Array.from({ length: 6 }, (_, i) => ({
      question: `q${i}`,
      answer: `a${i}`
    }))
    const msg = buildSuggestUserMessage({
      suspectName: 'X',
      crime: 'c',
      synopsis: 's',
      transcript
    })
    expect(msg).toContain('q5')
    expect(msg).not.toContain('q1')
  })
})
