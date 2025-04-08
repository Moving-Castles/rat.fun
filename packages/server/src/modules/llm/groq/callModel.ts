import { MessageParam } from '@anthropic-ai/sdk/resources';
import Groq from 'groq-sdk';

export async function callModel(groq: Groq, messages: MessageParam[], system: string, temperature: number = 1)  {
    const combinedMessages = [
        { role: "system", content: system },
        { role: "user", content: messages.map(m => m.content).join("\n") }
    ]

    const completion = await groq.chat.completions.create({
        messages: combinedMessages,
        response_format: { type: "json_object" }, 
        // model: "llama-3.3-70b-versatile",
        // model: "meta-llama/llama-4-maverick-17b-128e-instruct",
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        // model: "qwen-2.5-32b",
        // model:"llama-3.3-70b-specdec",
        temperature: temperature
      });

    return parseReturnMessage(completion);
}

function parseReturnMessage(msg: Groq.Chat.Completions.ChatCompletion) {
    let rawText = msg.choices[0].message.content ?? "";

    // console.log('rawText', rawText);

    // Remove Markdown-style code block indicators
    rawText = rawText.replace(/^\s*```(?:json)?\s*/i, "").replace(/\s*```$/, "");

    // console.log('rawText cleaned', rawText);

    try {
        const returnValue = JSON.parse(rawText);
        return returnValue;
    } catch (error) {
        console.error("Failed to parse JSON:", error);
    }
}