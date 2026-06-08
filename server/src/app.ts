import express from 'express';
import cors from 'cors';
import { db } from './services/db.js';

const app = express();

app.use(cors());
app.use(express.json());

// Base Health Check Endpoint
app.get('/health', async (_req, res) => {
    try {
        // Simple verification check to guarantee Supabase connection is healthy
        await db.query('SELECT 1');
        res.status(200).json({ status: 'healthy', database: 'connected' });
    } catch (error) {
        res.status(500).json({ status: 'unhealthy', database: 'Database unreachable' });
    }
});

export default app;