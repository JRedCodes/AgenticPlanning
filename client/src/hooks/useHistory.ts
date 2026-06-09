import { useEffect } from 'react';
import { useGraphStore } from '../store/graphStore.ts';
import { authFetch } from '../lib/api.ts';

export function useHistory(projectId: string): void {
    const setHistory = useGraphStore((state) => state.setHistory);

    useEffect(() => {
        async function fetchHistory() {
            try {
                const res = await authFetch(`/projects/${projectId}/history`);
                if (!res.ok) return;
                const data = await res.json() as Parameters<typeof setHistory>[0];
                setHistory(data);
            } catch {
                console.warn('Could not load commit history');
            }
        }

        fetchHistory();
    }, [projectId, setHistory]);
}
