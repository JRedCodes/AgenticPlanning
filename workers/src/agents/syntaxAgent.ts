import { streamText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import type { StructureOutput } from './structureAgent.js';

type StructureNode = StructureOutput['nodes'][number];

export async function runSyntaxAgent(
    node: StructureNode,
    onChunk: (chunk: string) => Promise<void>
): Promise<string> {
    const result = streamText({
        model: anthropic('claude-sonnet-4-6'),
        prompt: `You are an expert TypeScript engineer. Write a concise TypeScript code stub for this software component.

Component: ${node.data.title}
Dependencies: ${node.data.dependencies.join(', ') || 'none'}

Requirements:
- Write a TypeScript interface or class that represents this component's core contract
- Include key method signatures with typed parameters and return types
- Add brief inline comments only where the purpose is non-obvious
- Maximum 30 lines
- No imports needed, just the type/class definition`,
    });

    let fullSyntax = '';
    for await (const chunk of result.textStream) {
        fullSyntax += chunk;
        await onChunk(chunk);
    }

    return fullSyntax;
}
