import { create } from 'zustand';
import type { Node, Edge } from '@xyflow/react';
import type { WorkerEvent } from '@project/shared';

export interface SystemNodeData extends Record<string, unknown> {
    title: string;
    syntax: string;
    dependencies: string[];
    isStreaming: boolean;
}

type SystemNode = Node<SystemNodeData>;

interface GraphStore {
    nodes: SystemNode[];
    edges: Edge[];
    isWorkerActive: boolean;
    applyWorkerEvent: (event: WorkerEvent) => void;
    setNodes: (nodes: SystemNode[]) => void;
    setEdges: (edges: Edge[]) => void;
}

export const useGraphStore = create<GraphStore>((set) => ({
    nodes: [],
    edges: [],
    isWorkerActive: false,

    setNodes: (nodes) => set({ nodes }),
    setEdges: (edges) => set({ edges }),

    applyWorkerEvent: (event) => {
        switch (event.type) {
            case 'structure:complete':
                set({
                    isWorkerActive: true,
                    nodes: event.nodes.map((n) => ({
                        id: n.id,
                        type: 'systemNode',
                        position: n.position,
                        data: {
                            title: n.data.title,
                            syntax: '',
                            dependencies: n.data.dependencies,
                            isStreaming: false,
                        },
                    })),
                    edges: event.edges.map((e) => ({
                        id: e.id,
                        source: e.source,
                        target: e.target,
                        animated: true,
                    })),
                });
                break;

            case 'syntax:delta':
                set((state) => ({
                    nodes: state.nodes.map((n) =>
                        n.id === event.nodeId
                            ? { ...n, data: { ...n.data, syntax: n.data.syntax + event.chunk, isStreaming: true } }
                            : n
                    ),
                }));
                break;

            case 'syntax:complete':
                set((state) => ({
                    nodes: state.nodes.map((n) =>
                        n.id === event.nodeId
                            ? { ...n, data: { ...n.data, syntax: event.syntax, isStreaming: false } }
                            : n
                    ),
                }));
                break;

            case 'commit:ready':
                set({ isWorkerActive: false });
                break;

            case 'job:error':
                set({ isWorkerActive: false });
                console.error('Worker error:', event.message);
                break;
        }
    },
}));
