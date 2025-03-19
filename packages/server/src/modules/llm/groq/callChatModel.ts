import { MessageParam } from '@anthropic-ai/sdk/resources';
import OpenAI from 'openai';

export async function callChatModel(openai: OpenAI, messages: MessageParam[], system: string)  {
    const combinedMessages = [
        { role: "system", content: system },
        { role: "user", content: messages.map(m => m.content).join("\n") }
    ]

    const completion = await openai.chat.completions.create({
        messages: combinedMessages,
        model: "deepseek-r1-distill-qwen-32b"
      });

    return parseReturnMessage(completion);
}

function parseReturnMessage(msg: OpenAI.Chat.Completions.ChatCompletion) {
    const rawText = msg.choices[0].message.content ?? "";

    console.log('rawText', rawText);

    return rawText;
}