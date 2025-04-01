import { MessageParam } from '@anthropic-ai/sdk/resources';
import { ANTHROPIC_MODEL } from '@config';
import Anthropic from '@anthropic-ai/sdk';

export async function callModel(anthropic: Anthropic, messages: MessageParam[], system: string, temperature: number = 1)  {
    const msg = await anthropic.messages.create({
        model: ANTHROPIC_MODEL,
        max_tokens: 1024,
        messages,
        system,
        temperature
    });
    
    return parseReturnMessage(msg);
}

function parseReturnMessage(msg: Anthropic.Messages.Message) {
    let rawText = msg.content[0]?.text ?? "";

    // Remove Markdown-style code block indicators
    rawText = rawText.replace(/^```json\s*/i, "").replace(/```$/, "");

    // Parse the text into a native object
    try {
        const returnValue = JSON.parse(rawText);
        return returnValue;
    } catch (error) {
        console.error("Failed to parse JSON:", error);
    }
}