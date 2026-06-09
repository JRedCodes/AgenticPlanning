import { Worker } from 'bullmq';
import { REDIS_CONFIG } from '../config/redis.js';
import { publishEvent } from '../services/redisPublisher.js';
import { runStructureAgent, type StructureOutput } from '../agents/structureAgent.js';
import { runSyntaxAgent } from '../agents/syntaxAgent.js';
import { validateStructure, validateSyntax } from '../lib/guardrails.js';
import type { ChatJobData } from '@project/shared';

const MAX_STRUCTURE_RETRIES = 2;
const MAX_SYNTAX_RETRIES = 1;

async function generateStructureWithGuardrails(message: string): Promise<StructureOutput> {
    let lastErrors: string[] = [];

    for (let attempt = 0; attempt <= MAX_STRUCTURE_RETRIES; attempt++) {
        const output = await runStructureAgent(message, attempt > 0 ? lastErrors : undefined);
        const result = validateStructure(output);

        if (result.valid) return output;

        lastErrors = result.errors;
        console.warn(`Structure guardrail failed (attempt ${attempt + 1}/${MAX_STRUCTURE_RETRIES + 1}):`, result.errors);
    }

    throw new Error(`Structure validation failed after ${MAX_STRUCTURE_RETRIES + 1} attempts: ${lastErrors.join('; ')}`);
}

async function generateSyntaxWithGuardrails(
    node: StructureOutput['nodes'][number],
    onChunk: (chunk: string) => Promise<void>
): Promise<string> {
    // Attempt 1: stream normally
    const syntax = await runSyntaxAgent(node, onChunk);
    const result = validateSyntax(syntax, node.data.title);
    if (result.valid) return syntax;

    console.warn(`Syntax guardrail failed for "${node.id}" — retrying silently:`, result.errors);

    // Attempt 2: non-streaming retry with error context
    for (let attempt = 0; attempt < MAX_SYNTAX_RETRIES; attempt++) {
        const corrected = await runSyntaxAgent(node, async () => undefined, result.errors);
        const correctedResult = validateSyntax(corrected, node.data.title);

        if (correctedResult.valid) return corrected;

        console.warn(`Syntax guardrail still failing for "${node.id}" (retry ${attempt + 1}/${MAX_SYNTAX_RETRIES}) — using best available output`);
        return corrected;
    }

    return syntax;
}

export function createChatWorker(): Worker<ChatJobData> {
    const worker = new Worker<ChatJobData>(
        'chat',
        async (job) => {
            const { projectId, userId, message } = job.data;
            const jobId = job.id ?? 'unknown';

            try {
                // Phase 1: generate and validate graph structure
                const { nodes, edges } = await generateStructureWithGuardrails(message);

                await publishEvent(projectId, { type: 'structure:complete', nodes, edges, jobId });

                // Phase 2: generate and validate syntax for each node
                const nodesWithSyntax = [];
                for (const node of nodes) {
                    const syntax = await generateSyntaxWithGuardrails(node, async (chunk) => {
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
