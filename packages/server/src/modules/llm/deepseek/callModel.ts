import { MessageParam } from '@anthropic-ai/sdk/resources';
import OpenAI from 'openai';

export async function callModel(openai: OpenAI, messages: MessageParam[], system: string)  {
    // const combinedMessages = [
    //     ...messages,
    //     { role: "system", content: system }
    // ]

    const combinedMessages = [
        { role: "system", content: system },
        { role: "user", content: messages.map(m => m.content).join("\n") }
    ]

    const completion = await openai.chat.completions.create({
        messages: combinedMessages,
        model: "deepseek-reasoner",
        // temperature: 0,
      });

    return parseReturnMessage(completion);
}

function parseReturnMessage(msg: OpenAI.Chat.Completions.ChatCompletion) {
    let rawText = msg.choices[0].message.content ?? "";

    // Remove Markdown-style code block indicators
    rawText = rawText.replace(/^```json\s*/i, "").replace(/```$/, "");

    try {
        const returnValue = JSON.parse(rawText);
        console.log(returnValue);
        return returnValue;
    } catch (error) {
        console.error("Failed to parse JSON:", error);
    }
}

