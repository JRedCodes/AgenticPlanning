import { generateObject } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';
import type { ExistingNode } from '@project/shared';

const StructureOutputSchema = z.object({
    nodes: z.array(z.object({
        id: z.string(),
        type: z.string(),
        position: z.object({ x: z.number(), y: z.number() }),
        data: z.object({
            title: z.string(),
            syntax: z.string(),
            dependencies: z.array(z.string()),
        }),
    })),
    edges: z.array(z.object({
        id: z.string(),
        source: z.string(),
        target: z.string(),
    })),
});

export type StructureOutput = z.infer<typeof StructureOutputSchema>;

const SHARED_RULES = `Rules for all nodes:
- Node ids must be snake_case and descriptive: "auth_service", "postgres_db"
- Node type must always be "systemNode"
- Position nodes on a grid: x and y values spaced 250px apart, starting at x:100 y:100
- Each node's data.syntax must be an empty string (will be filled later)
- Each node's data.dependencies must list relevant npm packages
- Edges must have id format "edge__{source}__{target}"
- Only connect nodes that have a direct data or control flow relationship`;

function buildPrompt(
    message: string,
    existingNodes?: ExistingNode[],
    previousErrors?: string[]
): string {
    const retryContext = previousErrors?.length
        ? `\n\nYour previous response was rejected for the following reasons:\n${previousErrors.map(e => `- ${e}`).join('\n')}\n\nFix ALL of these issues in your new response.`
        : '';

    if (existingNodes?.length) {
        const nodeList = existingNodes
            .map(n => `- ${n.id}: ${n.title} (${n.dependencies.join(', ') || 'no deps'})`)
            .join('\n');

        return `You are an expert software architect modifying an existing system architecture.

Current architecture:
${nodeList}

User request: "${message}"

${SHARED_RULES}

Important modification rules:
- Preserve the IDs of nodes the user did NOT ask to change
- Only add, remove, or modify nodes that are directly relevant to the request
- Maintain existing connections that are still valid after the change
- Do NOT redesign the entire system — make targeted changes only${retryContext}`;
    }

    return `You are an expert software architect. Design a software system architecture as a node graph.

User request: "${message}"

Generate 3–8 nodes representing services, databases, APIs, or UI layers.

${SHARED_RULES}${retryContext}`;
}

export async function runStructureAgent(
    message: string,
    existingNodes?: ExistingNode[],
    previousErrors?: string[]
): Promise<StructureOutput> {
    const { object } = await generateObject({
        model: anthropic('claude-sonnet-4-6'),
        schema: StructureOutputSchema,
        prompt: buildPrompt(message, existingNodes, previousErrors),
    });

    return object;
}
