import Anthropic from "@anthropic-ai/sdk"

export function getLLMClient(apiKey: string): Anthropic {
  return new Anthropic({
    apiKey
  })
}
