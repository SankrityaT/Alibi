import { describe, expect, it } from 'vitest'
import { FakeAnthropicClient } from '../anthropic/fakeClient.js'
import type { AnthropicMessageParams } from '../anthropic/types.js'
import { fallbackCase } from '../../content/cases/fallbackCase.js'
import type { CaseFile, Difficulty } from './types.js'
import {
  CaseGenerationError,
  buildCaseGenerationPrompt,
  generateCase,
  parseCaseJson,
} from './generate.js'

// A structurally valid CaseFile at a given difficulty, derived from the
// hand-authored fallback so validateCase passes.
function validCaseFor(difficulty: Difficulty): CaseFile {
  const c = structuredClone(fallbackCase)
  c.id = `gen-${difficulty}`
  c.difficulty = difficulty
  if (difficulty === 'easy') {
    // easy targets exactly 3 suspects; drop a non-culprit, unreferenced one.
    const removed = 'victor'
    c.suspects = c.suspects.filter((s) => s.suspectId !== removed)
    c.timeline = c.timeline.filter((t) => !t.suspectIds.includes(removed))
    c.evidence = c.evidence.filter(
      (e) => !e.implicatesSuspectIds.includes(removed),
    )
  }
  return c
}

function jsonReply(caseFile: CaseFile): string {
  return JSON.stringify(caseFile)
}

function fencedReply(caseFile: CaseFile): string {
  return 'Here is your case:\n```json\n' + JSON.stringify(caseFile, null, 2) + '\n```\n'
}

describe('parseCaseJson', () => {
  it('parses a bare JSON object', () => {
    const parsed = parseCaseJson(jsonReply(fallbackCase))
    expect(parsed.id).toBe(fallbackCase.id)
    expect(parsed.suspects).toHaveLength(fallbackCase.suspects.length)
  })

  it('parses JSON fenced in a ```json code block with surrounding prose', () => {
    const parsed = parseCaseJson(fencedReply(fallbackCase))
    expect(parsed.culpritId).toBe(fallbackCase.culpritId)
  })

  it('parses a JSON object embedded in leading/trailing prose without fences', () => {
    const text = `Sure! ${jsonReply(fallbackCase)} Hope that helps.`
    const parsed = parseCaseJson(text)
    expect(parsed.title).toBe(fallbackCase.title)
  })

  it('throws on text with no JSON object', () => {
    expect(() => parseCaseJson('I could not generate a case.')).toThrow()
  })

  it('throws on malformed JSON', () => {
    expect(() => parseCaseJson('```json\n{ "id": "x", }\n```')).toThrow()
  })
})

describe('buildCaseGenerationPrompt', () => {
  it('includes the difficulty and demands strict JSON', () => {
    const { system, userMessage } = buildCaseGenerationPrompt({
      difficulty: 'hard',
    })
    expect(system.length).toBeGreaterThan(0)
    expect(userMessage).toContain('hard')
    // Prompt should steer the model toward JSON-only output.
    expect((system + userMessage).toLowerCase()).toContain('json')
  })

  it('threads an optional seed into the user message', () => {
    const { userMessage } = buildCaseGenerationPrompt({
      difficulty: 'easy',
      seed: 'lighthouse-poisoning',
    })
    expect(userMessage).toContain('lighthouse-poisoning')
  })
})

describe('generateCase', () => {
  it('resolves a CaseFile whose difficulty matches params from a valid reply', async () => {
    const anthropic = new FakeAnthropicClient(() =>
      jsonReply(validCaseFor('easy')),
    )
    const result = await generateCase({ difficulty: 'easy' }, { anthropic })
    expect(result.difficulty).toBe('easy')
    expect(anthropic.calls).toHaveLength(1)
  })

  it('accepts a reply fenced in a ```json block', async () => {
    const anthropic = new FakeAnthropicClient(() =>
      fencedReply(validCaseFor('medium')),
    )
    const result = await generateCase({ difficulty: 'medium' }, { anthropic })
    expect(result.difficulty).toBe('medium')
  })

  it('retries after an invalid JSON reply then succeeds on attempt 2', async () => {
    let call = 0
    const anthropic = new FakeAnthropicClient(() => {
      call += 1
      if (call === 1) return 'sorry, no JSON here'
      return jsonReply(validCaseFor('medium'))
    })
    const result = await generateCase({ difficulty: 'medium' }, { anthropic })
    expect(result.difficulty).toBe('medium')
    expect(anthropic.calls).toHaveLength(2)
  })

  it('retries when a parsed case fails validation then succeeds', async () => {
    let call = 0
    const anthropic = new FakeAnthropicClient(() => {
      call += 1
      if (call === 1) {
        // Structurally parseable but fails validateCase (no culprit).
        const bad = structuredClone(validCaseFor('medium'))
        for (const s of bad.suspects) s.isCulprit = false
        return jsonReply(bad)
      }
      return jsonReply(validCaseFor('medium'))
    })
    const result = await generateCase({ difficulty: 'medium' }, { anthropic })
    expect(result.difficulty).toBe('medium')
    expect(anthropic.calls).toHaveLength(2)
  })

  it('rejects with CaseGenerationError after maxAttempts when never valid', async () => {
    const anthropic = new FakeAnthropicClient(() => {
      const bad = structuredClone(validCaseFor('medium'))
      for (const s of bad.suspects) s.isCulprit = false
      return jsonReply(bad)
    })
    await expect(
      generateCase({ difficulty: 'medium' }, { anthropic, maxAttempts: 3 }),
    ).rejects.toBeInstanceOf(CaseGenerationError)
    expect(anthropic.calls).toHaveLength(3)
  })

  it('honors a custom validate function', async () => {
    const anthropic = new FakeAnthropicClient(() =>
      jsonReply(validCaseFor('medium')),
    )
    // Reject everything via custom validator -> exhausts attempts.
    await expect(
      generateCase(
        { difficulty: 'medium' },
        {
          anthropic,
          maxAttempts: 2,
          validate: () => ({
            ok: false,
            issues: [{ code: 'nope', message: 'always fails' }],
          }),
        },
      ),
    ).rejects.toBeInstanceOf(CaseGenerationError)
    expect(anthropic.calls).toHaveLength(2)
  })
})
