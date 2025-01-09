import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import cors from 'cors';
dotenv.config();
const app = express();
const port = 3131;
// Enable CORS
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.post('/ping', async (req, res) => {
    try {
        res.json({ message: "pong" });
    }
    catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'An error occurred while processing the request.' });
    }
});
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
