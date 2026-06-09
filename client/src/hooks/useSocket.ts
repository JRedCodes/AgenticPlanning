import { useEffect, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';
import { toast } from 'sonner';
import { useGraphStore, type CommitRecord } from '../store/graphStore.ts';
import { authFetch } from '../lib/api.ts';
import { applyElkLayout } from '../lib/layout.ts';
import type { WorkerEvent } from '@project/shared';

async function refetchHistory(projectId: string): Promise<void> {
    const r = await authFetch(`/projects/${projectId}/history`);
    const data = await r.json() as CommitRecord[];
    useGraphStore.getState().setHistory(data);
}

export function useSocket(projectId: string): void {
    const socketRef = useRef<Socket | null>(null);
    const applyWorkerEvent = useGraphStore((state) => state.applyWorkerEvent);
    const applyRollback = useGraphStore((state) => state.applyRollback);
    const setHistory = useGraphStore((state) => state.setHistory);

    useEffect(() => {
        const socket = io('http://localhost:5001');
        socketRef.current = socket;

        socket.on('connect', () => {
            socket.emit('join_project', projectId);
        });

        socket.on('worker:event', (event: WorkerEvent) => {
            applyWorkerEvent(event);

            if (event.type === 'structure:complete') {
                useGraphStore.getState().updateChatMessage(event.jobId, 'Building syntax...');
                useGraphStore.getState().setNeedsFitView(true);
                const { nodes, edges } = useGraphStore.getState();
                applyElkLayout(nodes, edges)
                    .then(layoutedNodes => {
                        useGraphStore.getState().setNodes(layoutedNodes);
                        useGraphStore.getState().setNeedsFitView(true);
                    })
                    .catch(() => toast.error('Layout failed — using default positions'));
            }

            if (event.type === 'commit:saved') {
                useGraphStore.getState().updateChatMessage(event.jobId, 'Done');
                refetchHistory(projectId).catch(() =>
                    toast.error('Failed to refresh history')
                );
            }

            if (event.type === 'job:error') {
                useGraphStore.getState().updateChatMessage(event.jobId, `Failed: ${event.message}`);
                toast.error(`Generation failed: ${event.message}`);
            }
        });

        socket.on('rollback', (state: Parameters<typeof applyRollback>[0]) => {
            applyRollback(state);
            refetchHistory(projectId).catch(() =>
                toast.error('Failed to refresh history after rollback')
            );
        });

        socket.on('node:moved', (state: Parameters<typeof applyRollback>[0]) => {
            applyRollback(state);
            refetchHistory(projectId).catch(() =>
                toast.error('Failed to refresh history')
            );
        });

        socket.on('node:updated', (state: Parameters<typeof applyRollback>[0]) => {
            applyRollback(state);
            refetchHistory(projectId).catch(() =>
                toast.error('Failed to refresh history')
            );
        });

        return () => {
            socket.disconnect();
        };
    }, [projectId, applyWorkerEvent, applyRollback, setHistory]);
}
