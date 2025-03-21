import Groq from 'groq-sdk';

export function getLLMClient(apiKey: string): Groq {
    return new Groq({ apiKey });
}