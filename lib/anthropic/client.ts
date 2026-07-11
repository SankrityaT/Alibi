import Anthropic from '@anthropic-ai/sdk'
import type { AnthropicClientLike, AnthropicMessageParams } from './types.js'

export class ClaudeClient implements AnthropicClientLike {
  private client: Anthropic
  private model: string

  constructor(apiKey: string, model = 'claude-sonnet-5') {
    this.client = new Anthropic({ apiKey })
    this.model = model
  }

  async createMessage(params: AnthropicMessageParams): Promise<string> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 500,
      system: params.system,
      messages: [{ role: 'user', content: params.userMessage }]
    })

    const textBlock = response.content.find((block) => block.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('Claude response contained no text block')
    }
    return textBlock.text
  }
}
