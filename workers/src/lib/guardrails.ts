import type { StructureOutput } from '../agents/structureAgent.js';

export interface GuardrailResult {
    valid: boolean;
    errors: string[];
}

export function validateStructure(output: StructureOutput): GuardrailResult {
    const errors: string[] = [];
    const nodeIds = new Set<string>();

    if (output.nodes.length === 0) {
        errors.push('No nodes were generated — expected 3–8 nodes');
    }
    if (output.nodes.length > 10) {
        errors.push(`Too many nodes (${output.nodes.length}) — maximum is 10`);
    }

    for (const node of output.nodes) {
        if (!node.data.title.trim()) {
            errors.push(`Node "${node.id}" has an empty title`);
        }
        if (nodeIds.has(node.id)) {
            errors.push(`Duplicate node ID: "${node.id}"`);
        }
        nodeIds.add(node.id);
    }

    for (const edge of output.edges) {
        if (!nodeIds.has(edge.source)) {
            errors.push(`Edge "${edge.id}" references unknown source node: "${edge.source}"`);
        }
        if (!nodeIds.has(edge.target)) {
            errors.push(`Edge "${edge.id}" references unknown target node: "${edge.target}"`);
        }
    }

    return { valid: errors.length === 0, errors };
}

export function validateSyntax(syntax: string, nodeTitle: string): GuardrailResult {
    const errors: string[] = [];

    if (!syntax || syntax.trim().length < 20) {
        errors.push(`Syntax for "${nodeTitle}" is empty or too short (minimum 20 characters)`);
        return { valid: false, errors };
    }

    const hasCodePatterns =
        /[{}]/.test(syntax) &&
        /\b(class|interface|type|function|const|export|import)\b/.test(syntax);

    if (!hasCodePatterns) {
        errors.push(`Syntax for "${nodeTitle}" does not appear to be valid TypeScript — must include type/class/function definitions`);
    }

    return { valid: errors.length === 0, errors };
}
