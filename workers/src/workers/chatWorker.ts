import { Worker } from 'bullmq';
import { REDIS_CONFIG } from '../config/redis.js';
import { publishEvent } from '../services/redisPublisher.js';
import { runStructureAgent, type StructureOutput } from '../agents/structureAgent.js';
import { validateStructure } from '../lib/guardrails.js';
import type { ChatJobData, ExistingNode } from '@project/shared';

const MAX_STRUCTURE_RETRIES = 2;

async function generateStructureWithGuardrails(
    message: string,
    existingNodes?: ExistingNode[]
): Promise<StructureOutput> {
    let lastErrors: string[] = [];

    for (let attempt = 0; attempt <= MAX_STRUCTURE_RETRIES; attempt++) {
        const output = await runStructureAgent(
            message,
            existingNodes,
            attempt > 0 ? lastErrors : undefined
        );
        const result = validateStructure(output);

        if (result.valid) return output;

        lastErrors = result.errors;
        console.warn(`Structure guardrail failed (attempt ${attempt + 1}/${MAX_STRUCTURE_RETRIES + 1}):`, result.errors);
    }

    throw new Error(`Structure validation failed after ${MAX_STRUCTURE_RETRIES + 1} attempts: ${lastErrors.join('; ')}`);
}

export function createChatWorker(): Worker<ChatJobData> {
    const worker = new Worker<ChatJobData>(
        'chat',
        async (job) => {
            const { projectId, userId, message } = job.data;
            const jobId = job.id ?? 'unknown';

            try {
                const { nodes, edges } = await generateStructureWithGuardrails(
                    message,
                    job.data.existingNodes
                );

                await publishEvent(projectId, { type: 'structure:complete', nodes, edges, jobId });

                await publishEvent(projectId, {
                    type: 'commit:ready',
                    nodes,
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
