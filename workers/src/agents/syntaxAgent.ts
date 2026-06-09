import { streamText, generateText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import type { StructureOutput } from './structureAgent.js';

type StructureNode = StructureOutput['nodes'][number];

const buildPrompt = (node: StructureNode, previousErrors?: string[]) => {
    const retryContext = previousErrors?.length
        ? `\n\nYour previous response was rejected:\n${previousErrors.map(e => `- ${e}`).join('\n')}\n\nFix all issues. Your response MUST include TypeScript type or class definitions with curly braces.`
        : '';

    return `You are an expert TypeScript engineer. Write a concise TypeScript code stub for this software component.

Component: ${node.data.title}
Dependencies: ${node.data.dependencies.join(', ') || 'none'}

Requirements:
- Write a TypeScript interface or class that represents this component's core contract
- Include key method signatures with typed parameters and return types
- Add brief inline comments only where the purpose is non-obvious
- Maximum 30 lines
- No imports needed, just the type/class definition${retryContext}`;
};

export async function runSyntaxAgent(
    node: StructureNode,
    onChunk: (chunk: string) => Promise<void>,
    previousErrors?: string[]
): Promise<string> {
    const prompt = buildPrompt(node, previousErrors);

    if (previousErrors?.length) {
        // Retry path: non-streaming so we can validate before showing to user
        const { text } = await generateText({
            model: anthropic('claude-sonnet-4-6'),
            prompt,
        });
        return text;
    }

    // Normal path: stream for real-time UX
    const result = streamText({
        model: anthropic('claude-sonnet-4-6'),
        prompt,
    });

    let fullSyntax = '';
    for await (const chunk of result.textStream) {
        fullSyntax += chunk;
        await onChunk(chunk);
    }
    return fullSyntax;
}
