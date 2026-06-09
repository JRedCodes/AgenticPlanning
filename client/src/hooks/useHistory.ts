import { useEffect } from 'react';
import { useGraphStore } from '../store/graphStore.ts';

export function useHistory(projectId: string): void {
    const setHistory = useGraphStore((state) => state.setHistory);

    useEffect(() => {
        async function fetchHistory() {
            try {
                const res = await fetch(`/projects/${projectId}/history`);
                if (!res.ok) return;
                const data = await res.json() as Parameters<typeof setHistory>[0];
                setHistory(data);
            } catch {
                // history unavailable, not fatal
            }
        }

        fetchHistory();
    }, [projectId, setHistory]);
}
