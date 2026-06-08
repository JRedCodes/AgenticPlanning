import { z } from 'zod';

export const NodeDataSchema = z.object({
    title: z.string(),
    syntax: z.string(),
    dependencies: z.array(z.string()),
    metadata: z.record(z.string(), z.any()).optional()
});

export const GraphNodeSchema = z.object({
    id: z.string(),
    type: z.string(),
    position: z.object({
        x: z.number(),
        y: z.number()
    }),
    data: NodeDataSchema
});

export const GraphEdgeSchema = z.object({
    id: z.string(),
    source: z.string(),
    target: z.string(),
    type: z.string().optional(),
    animated: z.boolean().optional()
});

export const GraphStateSchema = z.object({
    nodes: z.array(GraphNodeSchema),
    edges: z.array(GraphEdgeSchema),
    versionId: z.uuid(),
    parentVersionId: z.uuid().nullable()
});

export type NodeData = z.infer<typeof NodeDataSchema>;
export type GraphNode = z.infer<typeof GraphNodeSchema>;
export type GraphEdge = z.infer<typeof GraphEdgeSchema>;
export type GraphState = z.infer<typeof GraphStateSchema>;