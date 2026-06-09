import { Worker } from 'bullmq';
import { REDIS_CONFIG } from '../config/redis.js';
import { publishEvent } from '../services/redisPublisher.js';
import { runStructureAgent } from '../agents/structureAgent.js';
import { runSyntaxAgent } from '../agents/syntaxAgent.js';
import type { ChatJobData } from '@project/shared';

export function createChatWorker(): Worker<ChatJobData> {
    const worker = new Worker<ChatJobData>(
        'chat',
        async (job) => {
            const { projectId, userId, message } = job.data;
            const jobId = job.id ?? 'unknown';

            try {
                // Phase 1: generate graph structure
                const { nodes, edges } = await runStructureAgent(message);

                await publishEvent(projectId, { type: 'structure:complete', nodes, edges, jobId });

                // Phase 2: generate syntax for each node sequentially
                const nodesWithSyntax = [];
                for (const node of nodes) {
                    const syntax = await runSyntaxAgent(node, async (chunk) => {
                        await publishEvent(projectId, {
                            type: 'syntax:delta',
                            nodeId: node.id,
                            chunk,
                            jobId,
                        });
                    });

                    await publishEvent(projectId, {
                        type: 'syntax:complete',
                        nodeId: node.id,
                        syntax,
                        jobId,
                    });

                    nodesWithSyntax.push({ ...node, data: { ...node.data, syntax } });
                }

                // Phase 3: signal server to persist and broadcast final state
                await publishEvent(projectId, {
                    type: 'commit:ready',
                    nodes: nodesWithSyntax,
                    edges,
                    projectId,
                    userId,
                    message,
                    jobId,
                });
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : String(err);
                await publishEvent(projectId, { type: 'job:error', message: errorMessage, jobId });
                throw err;
            }
        },
        { connection: REDIS_CONFIG }
    );

    worker.on('completed', (job) => {
        console.log(`Job ${job.id} completed`);
    });

    worker.on('failed', (job, err) => {
        console.error(`Job ${job?.id} failed:`, err.message);
    });

    return worker;
}
