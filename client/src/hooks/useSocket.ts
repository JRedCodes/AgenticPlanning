import { useEffect, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useGraphStore } from '../store/graphStore.ts';
import type { WorkerEvent } from '@project/shared';

export function useSocket(projectId: string): void {
    const socketRef = useRef<Socket | null>(null);
    const applyWorkerEvent = useGraphStore((state) => state.applyWorkerEvent);

    useEffect(() => {
        const socket = io('http://localhost:5001');
        socketRef.current = socket;

        socket.on('connect', () => {
            socket.emit('join_project', projectId);
        });

        socket.on('worker:event', (event: WorkerEvent) => {
            applyWorkerEvent(event);
        });

        return () => {
            socket.disconnect();
        };
    }, [projectId, applyWorkerEvent]);
}
