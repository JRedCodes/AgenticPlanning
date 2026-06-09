import type { Request, Response } from 'express';
import { getCurrentState } from '../services/gitEngine.js';

export async function handleGetState(req: Request, res: Response): Promise<void> {
    const projectId = req.params['projectId'] as string;
    const state = await getCurrentState(projectId);
    if (!state) {
        res.status(404).json({ error: 'No state found for project' });
        return;
    }
    res.status(200).json(state);
}
