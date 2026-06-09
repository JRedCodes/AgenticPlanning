import type { Server } from 'socket.io';
import { redisClient } from './redisService.js';
import { getCurrentState, createCommit } from './gitEngine.js';
import type { WorkerEvent } from '@project/shared';

export async function startRedisSubscriber(io: Server): Promise<void> {
    const subscriber = redisClient.duplicate();
    await subscriber.connect();

    await subscriber.pSubscribe('project:*', async (message, channel) => {
        const projectId = channel.replace('project:', '');

        let event: WorkerEvent;
        try {
            event = JSON.parse(message) as WorkerEvent;
        } catch {
            console.error('Failed to parse worker event on channel', channel);
            return;
        }

        // Forward every event to the matching Socket.io room in real time
        io.to(projectId).emit('worker:event', event);

        // Persist the final graph when the worker signals it is ready
        if (event.type === 'commit:ready') {
            try {
                const current = await getCurrentState(event.projectId);
                const parentCommitId = current?.commitId ?? null;

                const commitId = await createCommit(
                    event.projectId,
                    parentCommitId,
                    `AI: ${event.message}`,
                    {
                        nodes: event.nodes,
                        edges: event.edges,
                        versionId: crypto.randomUUID(),
                        parentVersionId: parentCommitId,
                    }
                );

                io.to(projectId).emit('worker:event', {
                    type: 'commit:saved' as const,
                    commitId,
                    jobId: event.jobId,
                });
            } catch (err) {
                console.error(`Failed to persist commit for project ${projectId}:`, err);
                io.to(projectId).emit('worker:event', {
                    type: 'job:error' as const,
                    message: 'Failed to save commit to database',
                    jobId: event.jobId,
                });
            }
        }
    });

    console.log('Redis subscriber listening on project:* channels');
}
