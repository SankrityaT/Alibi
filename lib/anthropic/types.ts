export interface AnthropicMessageParams {
  system: string
  userMessage: string
  // Optional model tier for this call. Case generation uses 'sonnet' for speed;
  // omit to inherit the Agent SDK's default (the logged-in session model).
  model?: 'sonnet' | 'opus' | 'haiku'
}

export interface AnthropicClientLike {
  createMessage(params: AnthropicMessageParams): Promise<string>
}
