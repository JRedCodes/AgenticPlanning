import type { Request, Response } from 'express';
import { getCommitHistory } from '../services/gitEngine.js';

export async function handleHistory(req: Request, res: Response): Promise<void> {
    const projectId = req.params['projectId'] as string;
    const history = await getCommitHistory(projectId);
    res.status(200).json(history);
}
