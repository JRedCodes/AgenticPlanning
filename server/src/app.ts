import express from 'express';
import cors from 'cors';
import type { Server } from 'socket.io';
import { db } from './services/db.js';
import { handleChat } from './controllers/chatController.js';
import { handleHistory } from './controllers/historyController.js';
import { createRollbackController } from './controllers/rollbackController.js';

export function createApp(io: Server) {
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
    app.get('/projects/:projectId/history', handleHistory);
    app.post('/projects/:projectId/rollback', createRollbackController(io));

    return app;
}
