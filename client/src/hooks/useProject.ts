import { useEffect } from 'react';
import { useGraphStore } from '../store/graphStore.ts';
import { authFetch } from '../lib/api.ts';

export function useProject(): string | null {
    const projectId = useGraphStore((state) => state.projectId);
    const setProjectId = useGraphStore((state) => state.setProjectId);

    useEffect(() => {
        async function bootstrap() {
            try {
                const res = await authFetch('/projects/bootstrap');
                if (!res.ok) return;
                const { projectId: id } = await res.json() as { projectId: string };
                setProjectId(id);
            } catch {
                console.error('Failed to bootstrap project');
            }
        }
        bootstrap();
    }, [setProjectId]);

    return projectId;
}
