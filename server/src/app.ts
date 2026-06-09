import express from 'express';
import cors from 'cors';
import { db } from './services/db.js';
import { handleChat } from './controllers/chatController.js';
import { handleBootstrap } from './controllers/projectController.js';
import { handleHistory } from './controllers/historyController.js';
import { handleGetState } from './controllers/stateController.js';

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
app.get('/projects/bootstrap', handleBootstrap);
app.get('/projects/:projectId/history', handleHistory);
app.get('/projects/:projectId/state', handleGetState);

export default app;
