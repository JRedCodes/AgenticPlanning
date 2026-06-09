import { generateObject } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';

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

const BASE_PROMPT = (message: string) => `You are an expert software architect. Design a software system architecture as a node graph.

User request: "${message}"

Rules:
- Generate 3–8 nodes representing services, databases, APIs, or UI layers
- Node ids must be snake_case and descriptive: "auth_service", "postgres_db", "api_gateway"
- Node type must always be "systemNode"
- Position nodes on a grid: x and y values spaced 250px apart, starting at x:100 y:100
- Each node's data.syntax must be an empty string (will be filled later)
- Each node's data.dependencies must list relevant npm packages (e.g. ["express","jsonwebtoken"])
- Edges must have id format "edge__{source}__{target}"
- Only connect nodes that have a direct data or control flow relationship`;

export async function runStructureAgent(
    message: string,
    previousErrors?: string[]
): Promise<StructureOutput> {
    const retryContext = previousErrors?.length
        ? `\n\nYour previous response was rejected for the following reasons:\n${previousErrors.map(e => `- ${e}`).join('\n')}\n\nFix ALL of these issues in your new response.`
        : '';

    const { object } = await generateObject({
        model: anthropic('claude-sonnet-4-6'),
        schema: StructureOutputSchema,
        prompt: BASE_PROMPT(message) + retryContext,
    });

    return object;
}
