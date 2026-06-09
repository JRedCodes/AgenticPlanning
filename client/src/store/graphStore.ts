import { create } from 'zustand';
import type { Node, Edge } from '@xyflow/react';
import type { WorkerEvent } from '@project/shared';

export interface SystemNodeData extends Record<string, unknown> {
    title: string;
    description: string;
    exposes: string[];
    consumes: string[];
    dependencies: string[];
}

export interface CommitRecord {
    id: string;
    parentCommitId: string | null;
    commitMessage: string;
    createdAt: string;
}

export interface ProjectInfo {
    id: string;
    name: string;
    createdAt: string;
}

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    jobId?: string;
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
    projects: ProjectInfo[];
    setProjects: (projects: ProjectInfo[]) => void;
    switchProject: (projectId: string) => void;
    chatMessages: ChatMessage[];
    addChatMessage: (msg: Omit<ChatMessage, 'id'>) => void;
    updateChatMessage: (jobId: string, content: string) => void;
    needsFitView: boolean;
    setNeedsFitView: (value: boolean) => void;
    reset: () => void;
    applyRollback: (state: { commitId: string; graphState: { nodes: Array<{ id: string; type: string; position: { x: number; y: number }; data: { title: string; description?: string; exposes?: string[]; consumes?: string[]; dependencies: string[] } }>; edges: Array<{ id: string; source: string; target: string }> } }) => void;
}

export const useGraphStore = create<GraphStore>((set) => ({
    nodes: [],
    edges: [],
    isWorkerActive: false,
    commitHistory: [],
    activeCommitId: null,
    projectId: null,

    chatMessages: [],
    setNodes: (nodes) => set({ nodes }),
    setEdges: (edges) => set({ edges }),
    setHistory: (history) => set({ commitHistory: history }),
    addChatMessage: (msg) => set((state) => ({
        chatMessages: [...state.chatMessages, { ...msg, id: crypto.randomUUID() }],
    })),
    updateChatMessage: (jobId, content) => set((state) => ({
        chatMessages: state.chatMessages.map(m =>
            m.jobId === jobId && m.role === 'assistant' ? { ...m, content } : m
        ),
    })),
    needsFitView: false,
    projects: [],
    setActiveCommitId: (commitId) => set({ activeCommitId: commitId }),
    setProjectId: (id) => set({ projectId: id }),
    setProjects: (projects) => set({ projects }),
    switchProject: (projectId) => set({
        projectId,
        nodes: [],
        edges: [],
        commitHistory: [],
        activeCommitId: null,
        isWorkerActive: false,
        needsFitView: false,
        chatMessages: [],
    }),
    setNeedsFitView: (value) => set({ needsFitView: value }),
    reset: () => set({ nodes: [], edges: [], commitHistory: [], activeCommitId: null, projectId: null, isWorkerActive: false, needsFitView: false, projects: [], chatMessages: [] }),

    applyRollback: (state) => set({
        activeCommitId: state.commitId,
        nodes: state.graphState.nodes.map((n) => ({
            id: n.id,
            type: 'systemNode',
            position: n.position,
            data: {
                title: n.data.title,
                description: n.data.description ?? '',
                exposes: n.data.exposes ?? [],
                consumes: n.data.consumes ?? [],
                dependencies: n.data.dependencies,
            },
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
                            description: n.data.description,
                            exposes: n.data.exposes,
                            consumes: n.data.consumes,
                            dependencies: n.data.dependencies,
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
