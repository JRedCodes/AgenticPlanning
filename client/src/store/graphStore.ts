import { create } from 'zustand';
import type { Node, Edge } from '@xyflow/react';
import type { WorkerEvent } from '@project/shared';

export interface SystemNodeData extends Record<string, unknown> {
    title: string;
    syntax: string;
    dependencies: string[];
    isStreaming: boolean;
}

export interface CommitRecord {
    id: string;
    parentCommitId: string | null;
    commitMessage: string;
    createdAt: string;
}

type SystemNode = Node<SystemNodeData>;

interface GraphStore {
    nodes: SystemNode[];
    edges: Edge[];
    isWorkerActive: boolean;
    commitHistory: CommitRecord[];
    activeCommitId: string | null;
    projectId: string | null;
    applyWorkerEvent: (event: WorkerEvent) => void;
    setNodes: (nodes: SystemNode[]) => void;
    setEdges: (edges: Edge[]) => void;
    setHistory: (history: CommitRecord[]) => void;
    setActiveCommitId: (commitId: string) => void;
    setProjectId: (id: string) => void;
    reset: () => void;
    applyRollback: (state: { commitId: string; graphState: { nodes: Array<{ id: string; type: string; position: { x: number; y: number }; data: { title: string; syntax: string; dependencies: string[] } }>; edges: Array<{ id: string; source: string; target: string }> } }) => void;
}

export const useGraphStore = create<GraphStore>((set) => ({
    nodes: [],
    edges: [],
    isWorkerActive: false,
    commitHistory: [],
    activeCommitId: null,
    projectId: null,

    setNodes: (nodes) => set({ nodes }),
    setEdges: (edges) => set({ edges }),
    setHistory: (history) => set({ commitHistory: history }),
    setActiveCommitId: (commitId) => set({ activeCommitId: commitId }),
    setProjectId: (id) => set({ projectId: id }),
    reset: () => set({ nodes: [], edges: [], commitHistory: [], activeCommitId: null, projectId: null, isWorkerActive: false }),

    applyRollback: (state) => set({
        activeCommitId: state.commitId,
        nodes: state.graphState.nodes.map((n) => ({
            id: n.id,
            type: 'systemNode',
            position: n.position,
            data: { title: n.data.title, syntax: n.data.syntax, dependencies: n.data.dependencies, isStreaming: false },
        })),
        edges: state.graphState.edges.map((e) => ({
            id: e.id,
            source: e.source,
            target: e.target,
            animated: true,
        })),
    }),

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

            case 'commit:saved':
                set({ activeCommitId: event.commitId });
                break;

            case 'job:error':
                set({ isWorkerActive: false });
                console.error('Worker error:', event.message);
                break;
        }
    },
}));
