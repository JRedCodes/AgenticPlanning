import { toast } from 'sonner';
import { useGraphStore, type ProjectInfo, type CommitRecord } from '../store/graphStore.ts';
import { authFetch } from '../lib/api.ts';

export function useProjects() {
    const projects = useGraphStore((state) => state.projects);
    const setProjects = useGraphStore((state) => state.setProjects);
    const switchProject = useGraphStore((state) => state.switchProject);
    const applyRollback = useGraphStore((state) => state.applyRollback);
    const setHistory = useGraphStore((state) => state.setHistory);
    const setNeedsFitView = useGraphStore((state) => state.setNeedsFitView);

    async function loadProjectData(projectId: string): Promise<void> {
        const [stateRes, histRes] = await Promise.all([
            authFetch(`/projects/${projectId}/state`),
            authFetch(`/projects/${projectId}/history`),
        ]);

        if (stateRes.ok) {
            const state = await stateRes.json() as Parameters<typeof applyRollback>[0];
            if (state.graphState.nodes.length > 0) {
                applyRollback(state);
                setNeedsFitView(true);
            }
        }

        if (histRes.ok) {
            const history = await histRes.json() as CommitRecord[];
            setHistory(history);
        }
    }

    async function handleSwitch(projectId: string): Promise<void> {
        switchProject(projectId);
        try {
            await loadProjectData(projectId);
        } catch {
            toast.error('Failed to load project');
        }
    }

    async function createProject(name: string): Promise<void> {
        try {
            const res = await authFetch('/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name }),
            });
            if (!res.ok) {
                toast.error('Failed to create project');
                return;
            }
            const project = await res.json() as ProjectInfo;
            setProjects([...projects, project]);
            await handleSwitch(project.id);
        } catch {
            toast.error('Failed to create project');
        }
    }

    return { projects, handleSwitch, createProject };
}
