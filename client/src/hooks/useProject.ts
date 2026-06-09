import { useEffect } from 'react';
import { useGraphStore } from '../store/graphStore.ts';

export function useProject(): string | null {
    const projectId = useGraphStore((state) => state.projectId);
    const setProjectId = useGraphStore((state) => state.setProjectId);

    useEffect(() => {
        async function bootstrap() {
            try {
                const res = await fetch('/projects/bootstrap');
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
