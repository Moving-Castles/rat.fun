import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';

dotenv.config();

const PRIVATE_API_KEY = process.env.PRIVATE_ANTHROPIC_API_KEY as string;

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
    roomPrompt: string,
    ratPrompt: string
): Message[] {
    const messages: Message[] = [];
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

        const systemPrompt = `${realityPrompt} ${styleGuidelines}`;

        const messages = constructMessages(
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

        const anthropic = new Anthropic({
            apiKey: PRIVATE_API_KEY
        });

        const msg = await anthropic.messages.create({
            model: "claude-3-5-sonnet-20241022",
            max_tokens: 1024,
            messages: formattedMessages,
            system: systemPrompt
        });

        console.log(msg);

        res.json({ message: msg.content[0] });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'An error occurred while processing the request.' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
