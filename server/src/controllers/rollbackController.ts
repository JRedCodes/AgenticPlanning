import type { Request, Response } from 'express';
import type { Server } from 'socket.io';
import { rollback, getCurrentState } from '../services/gitEngine.js';

export function createRollbackController(io: Server) {
    return async function handleRollback(req: Request, res: Response): Promise<void> {
        const projectId = req.params['projectId'] as string;
        const { commitId } = req.body as { commitId: string };

        if (!commitId) {
            res.status(400).json({ error: 'commitId is required' });
            return;
        }

        await rollback(projectId, commitId);

        const state = await getCurrentState(projectId);
        if (!state) {
            res.status(404).json({ error: 'Project state not found after rollback' });
            return;
        }

        io.to(projectId).emit('rollback', state);

        res.status(200).json({ commitId: state.commitId });
    };
}
