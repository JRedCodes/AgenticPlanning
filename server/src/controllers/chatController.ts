import type { Request, Response } from 'express';
import { chatQueue } from '../services/queueProducer.js';
import type { ChatJobData } from '../services/queueProducer.js';

export async function handleChat(req: Request, res: Response): Promise<void> {
    const { projectId, userId, message } = req.body as ChatJobData;

    if (!projectId || !userId || !message) {
        res.status(400).json({ error: 'projectId, userId, and message are required' });
        return;
    }

    const job = await chatQueue.add('chat-request', { projectId, userId, message });

    res.status(202).json({ jobId: job.id });
}