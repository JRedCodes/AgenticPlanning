import type { GraphNode, GraphEdge } from './graph';

export type WorkerEvent =
    | { type: 'structure:complete'; nodes: GraphNode[]; edges: GraphEdge[]; jobId: string }
    | { type: 'syntax:delta'; nodeId: string; chunk: string; jobId: string }
    | { type: 'syntax:complete'; nodeId: string; syntax: string; jobId: string }
    | { type: 'commit:ready'; nodes: GraphNode[]; edges: GraphEdge[]; projectId: string; userId: string; message: string; jobId: string }
    | { type: 'commit:saved'; commitId: string; jobId: string }
    | { type: 'job:error'; message: string; jobId: string };
