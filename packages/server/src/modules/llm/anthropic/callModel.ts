import { MessageParam } from "@anthropic-ai/sdk/resources"
import Anthropic from "@anthropic-ai/sdk"
import {
  LLMError,
  LLMAPIError,
  LLMParseError,
  LLMOverloadedError,
  LLMTruncatedError
} from "@modules/error-handling/errors"

const MAX_TOKENS = Number(process.env.LLM_MAX_TOKENS) || 4096

export async function callModel(
  anthropic: Anthropic,
  messages: MessageParam[],
  system: string,
  model: string,
  temperature: number = 1
) {
  try {
    const msg = await anthropic.messages.create({
      model,
      max_tokens: MAX_TOKENS,
      messages,
      system: [
        {
          type: "text",
          text: system,
          cache_control: { type: "ephemeral" }
        }
      ],
      temperature
    })

    // Check if response was truncated due to max_tokens
    if (msg.stop_reason === "max_tokens") {
      throw new LLMTruncatedError(
        `LLM response truncated: hit max_tokens limit (${MAX_TOKENS}). stop_reason: ${msg.stop_reason}, input_tokens: ${msg.usage.input_tokens}, output_tokens: ${msg.usage.output_tokens}`,
        msg.stop_reason,
        msg.usage.input_tokens,
        msg.usage.output_tokens,
        MAX_TOKENS
      )
    }

    return parseReturnMessage(msg)
  } catch (error) {
    // If it's already one of our custom errors, rethrow it
    if (error instanceof LLMError) {
      throw error
    }

    // Check for Anthropic overloaded error specifically
    if (error instanceof Error && error.message.includes("529")) {
      try {
        const errorData = JSON.parse(error.message.split(" ").slice(2).join(" "))
        if (errorData?.error?.type === "overloaded_error") {
          throw new LLMOverloadedError(
            `Anthropic API is currently overloaded: ${errorData.error.message}`,
            error
          )
        }
      } catch (parseError) {
        // If we can't parse the error, fall through to generic handling
      }
    }

    // Otherwise, wrap it in our custom error
    throw new LLMAPIError(
      `Error calling Anthropic API: ${error instanceof Error ? error.message : String(error)}`,
      error
    )
  }
}

function parseReturnMessage(msg: Anthropic.Messages.Message) {
  try {
    // Fix for the linter error - check if content exists and has a text property
    let rawText = ""
    if (msg.content && msg.content.length > 0) {
      const contentBlock = msg.content[0]
      if ("text" in contentBlock) {
        rawText = contentBlock.text
      }
    }

    // Remove Markdown-style code block indicators
    rawText = rawText.replace(/^```json\s*/i, "").replace(/```$/, "")

    // Parse the text into a native object
    try {
      const returnValue = JSON.parse(rawText)
      return returnValue
    } catch (parseError) {
      throw new LLMParseError(
        `Failed to parse LLM response as JSON: ${parseError instanceof Error ? parseError.message : String(parseError)}`,
        rawText
      )
    }
  } catch (error) {
    // If it's already one of our custom errors, rethrow it
    if (error instanceof LLMError) {
      throw error
    }

    // Otherwise, wrap it in our custom error
    throw new LLMError(
      "LLM_PARSE_ERROR",
      "LLM processing error",
      `Error parsing LLM response: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}
