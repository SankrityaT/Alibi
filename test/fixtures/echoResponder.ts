import type { AnthropicMessageParams } from '../../lib/anthropic/types.js'

export function echoResponder(): (params: AnthropicMessageParams) => string {
  return (params) => `RESPONSE_USING: ${params.userMessage}`
}
