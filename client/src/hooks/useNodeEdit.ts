import { toast } from 'sonner';
import { useGraphStore } from '../store/graphStore.ts';
import { authFetch } from '../lib/api.ts';

export interface NodeEditData {
    title: string;
    description: string;
    exposes: string[];
    consumes: string[];
    dependencies: string[];
}

export function useNodeEdit(nodeId: string) {
    const projectId = useGraphStore((state) => state.projectId);
    const activeCommitId = useGraphStore((state) => state.activeCommitId);
    const setActiveCommitId = useGraphStore((state) => state.setActiveCommitId);
    const applyRollback = useGraphStore((state) => state.applyRollback);
    const setNeedsFitView = useGraphStore((state) => state.setNeedsFitView);

    async function saveNodeData(data: NodeEditData): Promise<boolean> {
        if (!projectId || !activeCommitId) return false;

        try {
            const res = await authFetch(`/projects/${projectId}/nodes/${nodeId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ expectedCommitId: activeCommitId, data }),
            });

            if (res.status === 409) {
                toast.warning('Canvas updated elsewhere — restoring latest version');
                const stateRes = await authFetch(`/projects/${projectId}/state`);
                if (stateRes.ok) {
                    const state = await stateRes.json() as Parameters<typeof applyRollback>[0];
                    applyRollback(state);
                    setNeedsFitView(false);
                }
                return false;
            }

            if (res.ok) {
                const { commitId } = await res.json() as { commitId: string };
                setActiveCommitId(commitId);
                return true;
            }
        } catch {
            toast.error('Failed to save node changes');
        }
        return false;
    }

    return { saveNodeData };
}
