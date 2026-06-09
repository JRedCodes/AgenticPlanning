import { useEffect } from 'react';
import { useGraphStore } from '../store/graphStore.ts';
import { authFetch } from '../lib/api.ts';

export function useProject(): string | null {
    const projectId = useGraphStore((state) => state.projectId);
    const setProjectId = useGraphStore((state) => state.setProjectId);
    const applyRollback = useGraphStore((state) => state.applyRollback);
    const setNeedsFitView = useGraphStore((state) => state.setNeedsFitView);

    useEffect(() => {
        async function bootstrap() {
            try {
                const res = await authFetch('/projects/bootstrap');
                if (!res.ok) return;
                const { projectId: id } = await res.json() as { projectId: string };
                setProjectId(id);

                const stateRes = await authFetch(`/projects/${id}/state`);
                if (!stateRes.ok) return;
                const state = await stateRes.json() as Parameters<typeof applyRollback>[0];
                if (state.graphState.nodes.length > 0) {
                    applyRollback(state);
                    setNeedsFitView(true);
                }
            } catch {
                console.error('Failed to bootstrap project');
            }
        }
        bootstrap();
    }, [setProjectId, applyRollback, setNeedsFitView]);

    return projectId;
}
