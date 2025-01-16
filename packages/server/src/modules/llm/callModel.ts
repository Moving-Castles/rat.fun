import { MessageParam } from '@anthropic-ai/sdk/resources';
import { ANTHROPIC_MODEL } from '@config';
import Anthropic from '@anthropic-ai/sdk';

export async function callModel(anthropic: Anthropic, messages: MessageParam[], system: string)  {
    const msg = await anthropic.messages.create({
        model: ANTHROPIC_MODEL,
        max_tokens: 1024,
        messages,
        system
    });

    return parseReturnMessage(msg);
}

function parseReturnMessage(msg: Anthropic.Messages.Message) {
    const rawText = msg.content[0]?.text ?? "";
    // Parse the text into a native object
    try {
        const returnValue = JSON.parse(rawText);
        console.log(returnValue);
        return returnValue;
    } catch (error) {
        console.error("Failed to parse JSON:", error);
    }
}