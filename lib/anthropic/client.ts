import { query } from '@anthropic-ai/claude-agent-sdk'
import type { AnthropicClientLike, AnthropicMessageParams } from './types.js'

// Uses the Claude Agent SDK instead of the plain Messages API SDK: it shells
// out to the local `claude` binary, which authenticates via `claude login`
// against the user's Claude subscription rather than a billed API key.
export class ClaudeClient implements AnthropicClientLike {
  async createMessage(params: AnthropicMessageParams): Promise<string> {
    let resultText: string | null = null

    for await (const message of query({
      prompt: params.userMessage,
      options: { systemPrompt: params.system }
    })) {
      if (message.type === 'result' && 'result' in message) {
        resultText = message.result
      }
    }

    if (resultText === null) {
      throw new Error('Claude Agent SDK query produced no result message')
    }
    return resultText
  }
}
