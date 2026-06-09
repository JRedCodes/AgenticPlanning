import { useCallback } from 'react';
import { applyNodeChanges, type NodeChange } from '@xyflow/react';
import { toast } from 'sonner';
import { useGraphStore, type SystemNodeData } from '../store/graphStore.ts';
import { authFetch } from '../lib/api.ts';
import type { Node } from '@xyflow/react';

export function useDrag(projectId: string) {
    const setNodes = useGraphStore((state) => state.setNodes);
    const isWorkerActive = useGraphStore((state) => state.isWorkerActive);
    const activeCommitId = useGraphStore((state) => state.activeCommitId);
    const setActiveCommitId = useGraphStore((state) => state.setActiveCommitId);
    const applyRollback = useGraphStore((state) => state.applyRollback);
    const setHistory = useGraphStore((state) => state.setHistory);

    const onNodesChange = useCallback((changes: NodeChange<Node<SystemNodeData>>[]) => {
        setNodes(applyNodeChanges(changes, useGraphStore.getState().nodes));

        if (isWorkerActive || !activeCommitId) return;

        const finishedDrags = changes
            .filter((c): c is Extract<NodeChange<Node<SystemNodeData>>, { type: 'position' }> =>
                c.type === 'position' && c.dragging === false
            )
            .flatMap(c => c.position ? [{ nodeId: c.id, position: c.position }] : []);

        if (finishedDrags.length === 0) return;

        async function persist() {
            try {
                const res = await authFetch(`/projects/${projectId}/drag`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ expectedCommitId: activeCommitId, updates: finishedDrags }),
                });

                if (res.status === 409) {
                    toast.warning('Canvas updated elsewhere — restoring latest version');
                    const stateRes = await authFetch(`/projects/${projectId}/state`);
                    if (stateRes.ok) {
                        const state = await stateRes.json() as Parameters<typeof applyRollback>[0];
                        applyRollback(state);
                    }
                    return;
                }

                if (res.ok) {
                    const { commitId } = await res.json() as { commitId: string };
                    setActiveCommitId(commitId);
                    const histRes = await authFetch(`/projects/${projectId}/history`);
                    if (histRes.ok) {
                        const history = await histRes.json() as Parameters<typeof setHistory>[0];
                        setHistory(history);
                    }
                }
            } catch {
                toast.error('Failed to save node position');
            }
        }

        persist();
    }, [setNodes, isWorkerActive, activeCommitId, projectId, setActiveCommitId, applyRollback, setHistory]);

    return { onNodesChange };
}
