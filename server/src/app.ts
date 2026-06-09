import express from 'express';
import cors from 'cors';
import { db } from './services/db.js';
import { handleChat } from './controllers/chatController.js';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', async (_req, res) => {
    try {
        await db.query('SELECT 1');
        res.status(200).json({ status: 'healthy', database: 'connected' });
    } catch {
        res.status(500).json({ status: 'unhealthy', database: 'unreachable' });
    }
});

app.post('/chat', handleChat);

export default app;