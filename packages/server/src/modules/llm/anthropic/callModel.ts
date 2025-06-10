import { MessageParam } from '@anthropic-ai/sdk/resources';
import { ANTHROPIC_MODEL } from '@config';
import Anthropic from '@anthropic-ai/sdk';
// import { JAILBREAK_PROMPT } from './jailbreak';

// Custom error classes for better error handling
export class LLMError extends Error {
  constructor(message: string, public code: string = 'LLM_ERROR') {
    super(message);
    this.name = 'LLMError';
  }
}

export class LLMAPIError extends LLMError {
  constructor(message: string, public originalError?: unknown) {
    super(message, 'LLM_API_ERROR');
    this.name = 'LLMAPIError';
    this.originalError = originalError;
  }
}

export class LLMParseError extends LLMError {
  constructor(message: string, public rawText: string) {
    super(message, 'LLM_PARSE_ERROR');
    this.name = 'LLMParseError';
    this.rawText = rawText;
  }
}

export async function callModel(anthropic: Anthropic, messages: MessageParam[], system: string, temperature: number = 1)  {
    try {
        const msg = await anthropic.messages.create({
            model: ANTHROPIC_MODEL,
            max_tokens: 1024,
            messages,
            system,
            temperature
        });
        
        return parseReturnMessage(msg);
    } catch (error) {
        // If it's already one of our custom errors, rethrow it
        if (error instanceof LLMError) {
            throw error;
        }
        
        // Otherwise, wrap it in our custom error
        throw new LLMAPIError(
            `Error calling Anthropic API: ${error instanceof Error ? error.message : String(error)}`,
            error
        );
    }
}

function parseReturnMessage(msg: Anthropic.Messages.Message) {
    try {
        // Fix for the linter error - check if content exists and has a text property
        let rawText = "";
        if (msg.content && msg.content.length > 0) {
            const contentBlock = msg.content[0];
            if ('text' in contentBlock) {
                rawText = contentBlock.text;
            }
        }

        // Remove Markdown-style code block indicators
        rawText = rawText.replace(/^```json\s*/i, "").replace(/```$/, "");

        // Parse the text into a native object
        try {
            const returnValue = JSON.parse(rawText);
            return returnValue;
        } catch (parseError) {
            console.error("Failed to parse JSON:", parseError);
            throw new LLMParseError(
                `Failed to parse LLM response as JSON: ${parseError instanceof Error ? parseError.message : String(parseError)}`,
                rawText
            );
        }
    } catch (error) {
        // If it's already one of our custom errors, rethrow it
        if (error instanceof LLMError) {
            throw error;
        }
        
        // Otherwise, wrap it in our custom error
        throw new LLMError(`Error parsing LLM response: ${error instanceof Error ? error.message : String(error)}`);
    }
}