import { useEffect, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useGraphStore, type CommitRecord } from '../store/graphStore.ts';
import { authFetch } from '../lib/api.ts';
import { applyElkLayout } from '../lib/layout.ts';
import type { WorkerEvent } from '@project/shared';

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
                // Fit immediately with AI positions so the diagram is always visible
                useGraphStore.getState().setNeedsFitView(true);
                const { nodes, edges } = useGraphStore.getState();
                applyElkLayout(nodes, edges)
                    .then(layoutedNodes => {
                        useGraphStore.getState().setNodes(layoutedNodes);
                        useGraphStore.getState().setNeedsFitView(true);
                    })
                    .catch(() => undefined);
            }

            if (event.type === 'commit:saved') {
                authFetch(`/projects/${projectId}/history`)
                    .then(r => r.json())
                    .then(data => useGraphStore.getState().setHistory(data as CommitRecord[]))
                    .catch(() => undefined);
            }
        });

        socket.on('rollback', (state: Parameters<typeof applyRollback>[0]) => {
            applyRollback(state);
            authFetch(`/projects/${projectId}/history`)
                .then((r) => r.json())
                .then((data) => setHistory(data as Parameters<typeof setHistory>[0]))
                .catch(() => undefined);
        });

        socket.on('node:moved', (state: Parameters<typeof applyRollback>[0]) => {
            applyRollback(state);
            authFetch(`/projects/${projectId}/history`)
                .then((r) => r.json())
                .then((data) => setHistory(data as Parameters<typeof setHistory>[0]))
                .catch(() => undefined);
        });

        return () => {
            socket.disconnect();
        };
    }, [projectId, applyWorkerEvent, applyRollback, setHistory]);
}
