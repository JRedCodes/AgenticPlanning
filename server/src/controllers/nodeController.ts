import type { Request, Response } from 'express';
import type { Server } from 'socket.io';
import type { NodeData } from '@project/shared';
import { updateNodeData, getCurrentState, ConflictError } from '../services/gitEngine.js';

interface NodeEditPayload {
    expectedCommitId: string;
    data: NodeData;
}

export function createNodeEditController(io: Server) {
    return async function handleNodeEdit(req: Request, res: Response): Promise<void> {
        const projectId = req.params['projectId'] as string;
        const nodeId = req.params['nodeId'] as string;
        const { expectedCommitId, data } = req.body as NodeEditPayload;

        if (!expectedCommitId || !data?.title) {
            res.status(400).json({ error: 'expectedCommitId and data are required' });
            return;
        }

        try {
            const commitId = await updateNodeData(projectId, expectedCommitId, nodeId, data);
            const state = await getCurrentState(projectId);
            if (state) {
                io.to(projectId).emit('node:updated', { commitId, graphState: state.graphState });
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
