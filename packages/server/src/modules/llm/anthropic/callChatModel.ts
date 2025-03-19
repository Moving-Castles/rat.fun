import { MessageParam } from '@anthropic-ai/sdk/resources';
import { ANTHROPIC_MODEL } from '@config';
import Anthropic from '@anthropic-ai/sdk';

export async function callChatModel(anthropic: Anthropic, messages: MessageParam[], system: string)  {
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

    console.log('rawText', rawText);

    return rawText;
}