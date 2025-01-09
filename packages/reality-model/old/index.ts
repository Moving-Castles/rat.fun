import express from 'express';
import bodyParser from 'body-parser';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const PRIVATE_ORG_ID = process.env.PRIVATE_ORG_ID as string;
const PRIVATE_PROJECT_ID = process.env.PRIVATE_PROJECT_ID as string;
const PRIVATE_API_KEY = process.env.PRIVATE_API_KEY as string;

const app = express();
const port = 3030;

// Enable CORS
app.use(cors());

app.use(bodyParser.urlencoded({ extended: true }));

interface Message {
    role: 'system' | 'user' | 'function';
    content: string;
    name?: string; // Optional name property
}

// Function to construct messages
function constructMessages(
    realityPrompt: string,
    styleGuidelines: string,
    roomPrompt: string,
    ratPrompt: string
): Message[] {
    const messages: Message[] = [];
    messages.push({ role: "system", content: realityPrompt });
    messages.push({ role: "system", content: styleGuidelines });
    messages.push({ role: "user", content: `Room: ${roomPrompt}` });
    messages.push({ role: "user", content: `Rat: ${ratPrompt}` });
    return messages;
}

// Route to handle OpenAI API requests
app.post('/api/generate', async (req, res) => {
    try {
        const {
            realityPrompt,
            styleGuidelines,
            roomPrompt,
            ratPrompt
        } = req.body;

        const openai = new OpenAI({
            apiKey: PRIVATE_API_KEY,
            organization: PRIVATE_ORG_ID,
            project: PRIVATE_PROJECT_ID,
        });

        const messages = constructMessages(
            realityPrompt,
            styleGuidelines,
            roomPrompt,
            ratPrompt
        );

        // Adjust messages to match the expected type
        const formattedMessages = messages.map(msg => {
            const formattedMessage: any = { role: msg.role, content: msg.content };
            if (msg.role === 'function') {
                formattedMessage.name = msg.name;
            }
            return formattedMessage;
        });

        const completion = await openai.chat.completions.create({
            messages: formattedMessages,
            model: "gpt-4o-mini", // Adjust model as needed
        });

        console.log(completion.choices[0].message);

        res.json({ message: completion.choices[0].message.content });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'An error occurred while processing the request.' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
