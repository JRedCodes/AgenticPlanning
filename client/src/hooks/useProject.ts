import { useEffect } from 'react';
import { toast } from 'sonner';
import { useGraphStore, type ProjectInfo } from '../store/graphStore.ts';
import { authFetch } from '../lib/api.ts';

export function useProject(): string | null {
    const projectId = useGraphStore((state) => state.projectId);
    const setProjectId = useGraphStore((state) => state.setProjectId);
    const setProjects = useGraphStore((state) => state.setProjects);
    const applyRollback = useGraphStore((state) => state.applyRollback);
    const setNeedsFitView = useGraphStore((state) => state.setNeedsFitView);

    useEffect(() => {
        async function bootstrap() {
            try {
                const [bootstrapRes, listRes] = await Promise.all([
                    authFetch('/projects/bootstrap'),
                    authFetch('/projects'),
                ]);

                if (!bootstrapRes.ok) return;
                const { projectId: id } = await bootstrapRes.json() as { projectId: string };
                setProjectId(id);

                if (listRes.ok) {
                    const list = await listRes.json() as ProjectInfo[];
                    setProjects(list);
                }

                const stateRes = await authFetch(`/projects/${id}/state`);
                if (!stateRes.ok) return;
                const state = await stateRes.json() as Parameters<typeof applyRollback>[0];
                if (state.graphState.nodes.length > 0) {
                    applyRollback(state);
                    setNeedsFitView(true);
                }
            } catch {
                toast.error('Failed to connect to project — try refreshing');
            }
        }
        bootstrap();
    }, [setProjectId, setProjects, applyRollback, setNeedsFitView]);

    return projectId;
}
