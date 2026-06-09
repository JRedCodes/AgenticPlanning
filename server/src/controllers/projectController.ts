import type { Request, Response } from 'express';
import { db } from '../services/db.js';
import type { AuthenticatedRequest } from '../middleware/authMiddleware.js';

export async function handleBootstrap(req: Request, res: Response): Promise<void> {
    const { userId } = (req as AuthenticatedRequest).user;

    const existing = await db.query<{ id: string }>(
        'SELECT id FROM projects WHERE user_id = $1 LIMIT 1',
        [userId]
    );
    if (existing.rows[0]) {
        res.status(200).json({ projectId: existing.rows[0].id });
        return;
    }

    const result = await db.query<{ id: string }>(
        'INSERT INTO projects (user_id, name) VALUES ($1, $2) RETURNING id',
        [userId, 'My Project']
    );
    const projectId = result.rows[0]?.id;
    if (!projectId) throw new Error('Failed to create project');

    res.status(200).json({ projectId });
}
