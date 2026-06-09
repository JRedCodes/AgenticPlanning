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
            description: z.string(),
            exposes: z.array(z.string()),
            consumes: z.array(z.string()),
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

const SHARED_RULES = `Rules:
- Node ids must be snake_case: "auth_service", "postgres_db", "api_gateway"
- Node type must always be "systemNode"
- Position nodes on a grid: x and y values spaced 250px apart, starting at x:100 y:100
- description: 1–2 sentences on what this component does and why it exists
- exposes: list of HTTP endpoints, events, or APIs this node provides (e.g. "POST /auth/login", "event: UserCreated")
- consumes: list of other nodes or external services this node calls (e.g. "PostgreSQL Database", "Stripe API")
- dependencies: relevant npm package names (e.g. ["express", "jsonwebtoken"])
- Edges must have id format "edge__{source}__{target}"
- Only connect nodes with a direct data or control flow relationship`;

function buildPrompt(
    message: string,
    existingNodes?: ExistingNode[],
    previousErrors?: string[]
): string {
    const retryContext = previousErrors?.length
        ? `\n\nYour previous response was rejected:\n${previousErrors.map(e => `- ${e}`).join('\n')}\nFix ALL of these issues.`
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

Modification rules:
- Preserve the IDs and descriptions of nodes the user did NOT ask to change
- Only add, remove, or modify nodes directly relevant to the request
- Maintain existing connections that are still valid
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
