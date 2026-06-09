import type { Request, Response } from 'express';
import type { Server } from 'socket.io';
import { createCommitWithLock, getCurrentState, ConflictError } from '../services/gitEngine.js';

interface DragPayload {
    expectedCommitId: string;
    updates: Array<{ nodeId: string; position: { x: number; y: number } }>;
}

export function createManualDragController(io: Server) {
    return async function handleManualDrag(req: Request, res: Response): Promise<void> {
        const projectId = req.params['projectId'] as string;
        const { expectedCommitId, updates } = req.body as DragPayload;

        if (!expectedCommitId || !updates?.length) {
            res.status(400).json({ error: 'expectedCommitId and updates are required' });
            return;
        }

        try {
            const commitId = await createCommitWithLock(
                projectId,
                expectedCommitId,
                'User: Moved node',
                updates
            );

            const state = await getCurrentState(projectId);
            if (state) {
                io.to(projectId).emit('node:moved', { commitId, graphState: state.graphState });
            }

            res.status(200).json({ commitId });
        } catch (err) {
            if (err instanceof ConflictError) {
                res.status(409).json({ error: err.message });
                return;
            }
            throw err;
        }
    };
}
