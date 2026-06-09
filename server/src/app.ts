import express from 'express';
import cors from 'cors';
import { db } from './services/db.js';
import { authMiddleware } from './middleware/authMiddleware.js';
import { handleRegister, handleLogin } from './controllers/authController.js';
import { handleChat } from './controllers/chatController.js';
import { handleBootstrap, handleListProjects, handleCreateProject } from './controllers/projectController.js';
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

// Public auth routes
app.post('/auth/register', handleRegister);
app.post('/auth/login', handleLogin);

// All project routes require a valid JWT
app.use('/projects', authMiddleware);
app.use('/chat', authMiddleware);

app.post('/chat', handleChat);
app.get('/projects', handleListProjects);
app.post('/projects', handleCreateProject);
app.get('/projects/bootstrap', handleBootstrap);
app.get('/projects/:projectId/history', handleHistory);
app.get('/projects/:projectId/state', handleGetState);

export default app;
