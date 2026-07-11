import type { AnthropicClientLike, AnthropicMessageParams } from './types.js'

export class FakeAnthropicClient implements AnthropicClientLike {
  public calls: AnthropicMessageParams[] = []

  constructor(private responder: (params: AnthropicMessageParams) => string) {}

  async createMessage(params: AnthropicMessageParams): Promise<string> {
    this.calls.push(params)
    return this.responder(params)
  }
}
