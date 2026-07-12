export interface AnthropicMessageParams {
  system: string
  userMessage: string
  // Optional model tier for this call. Case generation uses 'haiku' for speed;
  // omit to inherit the Agent SDK's default (the logged-in session model).
  model?: 'sonnet' | 'opus' | 'haiku'
  // Hard ceiling for this call. The Agent SDK spawns a subprocess that can wedge
  // (e.g. if the local session stalls); without a bound the whole request hangs
  // forever. On timeout the query is aborted and createMessage rejects, so
  // callers can fall back rather than hang.
  timeoutMs?: number
}

export interface AnthropicClientLike {
  createMessage(params: AnthropicMessageParams): Promise<string>
}
