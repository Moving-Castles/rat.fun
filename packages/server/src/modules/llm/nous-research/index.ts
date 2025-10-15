import OpenAI from "openai"

export function getLLMClient(apiKey: string): OpenAI {
  return new OpenAI({
    baseURL: "https://inference-api.nousresearch.com/v1",
    apiKey
  })
}

export { constructEventMessages, constructCorrectionMessages } from "./constructMessages"
export { callModel } from "./callModel"
