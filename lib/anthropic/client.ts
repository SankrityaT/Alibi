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
      options: {
        systemPrompt: params.system,
        // Make this a lean, single-shot completion. By default query() builds a
        // full coding agent — loading tool schemas, allowing multi-turn tool
        // loops, and (via settingSources) the user's CLAUDE.md + every
        // configured MCP server — none of which a one-off text/JSON generation
        // needs. Stripping them removes tens of seconds of per-call setup in a
        // warm session; the ~12s subprocess spawn (SDK issue #34) is the floor
        // that remains.
        allowedTools: [],
        mcpServers: {},
        settingSources: [],
        maxTurns: 1,
        includePartialMessages: false,
        ...(params.model ? { model: params.model } : {})
      }
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
