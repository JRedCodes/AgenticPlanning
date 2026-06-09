import type { Request, Response } from 'express';
import { db } from '../services/db.js';
import type { AuthenticatedRequest } from '../middleware/authMiddleware.js';

export async function handleBootstrap(req: Request, res: Response): Promise<void> {
    const { userId } = (req as AuthenticatedRequest).user;

    const existing = await db.query<{ id: string }>(
        'SELECT id FROM projects WHERE user_id = $1 ORDER BY created_at ASC LIMIT 1',
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

export async function handleListProjects(req: Request, res: Response): Promise<void> {
    const { userId } = (req as AuthenticatedRequest).user;

    const { rows } = await db.query<{ id: string; name: string; created_at: Date }>(
        'SELECT id, name, created_at FROM projects WHERE user_id = $1 ORDER BY created_at ASC',
        [userId]
    );

    res.status(200).json(rows.map(r => ({
        id: r.id,
        name: r.name,
        createdAt: r.created_at,
    })));
}

export async function handleCreateProject(req: Request, res: Response): Promise<void> {
    const { userId } = (req as AuthenticatedRequest).user;
    const { name } = req.body as { name: string };

    if (!name?.trim()) {
        res.status(400).json({ error: 'Project name is required' });
        return;
    }

    const result = await db.query<{ id: string; created_at: Date }>(
        'INSERT INTO projects (user_id, name) VALUES ($1, $2) RETURNING id, created_at',
        [userId, name.trim()]
    );
    const row = result.rows[0];
    if (!row) throw new Error('Failed to create project');

    res.status(201).json({ id: row.id, name: name.trim(), createdAt: row.created_at });
}
