export interface AnthropicMessageParams {
  system: string
  userMessage: string
}

export interface AnthropicClientLike {
  createMessage(params: AnthropicMessageParams): Promise<string>
}
