import type { Request, Response } from 'express';
import { db } from '../services/db.js';

// Placeholder UUIDs — replaced when auth is implemented
const DEFAULT_PROJECT_ID = '00000000-0000-0000-0000-000000000001';
const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000002';

export async function handleBootstrap(_req: Request, res: Response): Promise<void> {
    await db.query(
        `INSERT INTO projects (id, user_id, name)
         VALUES ($1, $2, $3)
         ON CONFLICT (id) DO NOTHING`,
        [DEFAULT_PROJECT_ID, DEFAULT_USER_ID, 'Default Project']
    );
    res.status(200).json({ projectId: DEFAULT_PROJECT_ID });
}
