import type { Request, Response } from 'express';
import { chatQueue } from '../services/queueProducer.js';
import { getCurrentState } from '../services/gitEngine.js';
import type { AuthenticatedRequest } from '../middleware/authMiddleware.js';

export async function handleChat(req: Request, res: Response): Promise<void> {
    const { userId } = (req as AuthenticatedRequest).user;
    const { projectId, message } = req.body as { projectId: string; message: string };

    if (!projectId || !message) {
        res.status(400).json({ error: 'projectId and message are required' });
        return;
    }

    const current = await getCurrentState(projectId);
    const existingNodes = current?.graphState.nodes.map(n => ({
        id: n.id,
        title: n.data.title,
        dependencies: n.data.dependencies,
    })) ?? [];

    const job = await chatQueue.add('chat-request', {
        projectId,
        userId,
        message,
        ...(existingNodes.length > 0 ? { existingNodes } : {}),
    });

    res.status(202).json({ jobId: job.id });
}
