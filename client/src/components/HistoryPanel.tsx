import { useState } from 'react';
import { RotateCcw, GitCommit } from 'lucide-react';
import { useGraphStore } from '../store/graphStore.ts';

interface HistoryPanelProps {
    projectId: string;
}

export default function HistoryPanel({ projectId }: HistoryPanelProps) {
    const commitHistory = useGraphStore((state) => state.commitHistory);
    const activeCommitId = useGraphStore((state) => state.activeCommitId);
    const applyRollback = useGraphStore((state) => state.applyRollback);
    const setHistory = useGraphStore((state) => state.setHistory);
    const [rollingBack, setRollingBack] = useState<string | null>(null);

    if (commitHistory.length === 0) return null;

    async function handleRollback(commitId: string) {
        if (rollingBack) return;
        setRollingBack(commitId);
        try {
            const res = await fetch(`/projects/${projectId}/rollback`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ commitId }),
            });
            if (res.ok) {
                const data = await res.json() as { commitId: string };
                // optimistically mark the active commit — socket event will confirm
                applyRollback({ commitId: data.commitId, graphState: { nodes: [], edges: [] } });
                const histRes = await fetch(`/projects/${projectId}/history`);
                const history = await histRes.json() as Parameters<typeof setHistory>[0];
                setHistory(history);
            }
        } finally {
            setRollingBack(null);
        }
    }

    return (
        <div style={{
            position: 'absolute',
            top: 16,
            left: 16,
            width: 240,
            background: '#111120',
            border: '1px solid #2d2d4e',
            borderRadius: 8,
            overflow: 'hidden',
            zIndex: 10,
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        }}>
            <div style={{
                padding: '10px 14px',
                borderBottom: '1px solid #2d2d4e',
                fontSize: 12,
                fontWeight: 600,
                color: '#64748b',
                letterSpacing: '0.05em',
            }}>
                HISTORY
            </div>

            <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                {commitHistory.map((commit) => {
                    const isActive = commit.id === activeCommitId;
                    const isLoading = rollingBack === commit.id;
                    const date = new Date(commit.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                    });

                    return (
                        <div
                            key={commit.id}
                            style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: 8,
                                padding: '8px 14px',
                                borderBottom: '1px solid #1a1a2e',
                                background: isActive ? '#1a1a2e' : 'transparent',
                                transition: 'background 0.15s',
                            }}
                        >
                            <GitCommit
                                size={13}
                                style={{ color: isActive ? '#a78bfa' : '#2d2d4e', marginTop: 2, flexShrink: 0 }}
                            />
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{
                                    fontSize: 11,
                                    color: isActive ? '#e2e8f0' : '#94a3b8',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                }}>
                                    {commit.commitMessage}
                                </div>
                                <div style={{ fontSize: 10, color: '#475569', marginTop: 2 }}>{date}</div>
                            </div>
                            {!isActive && (
                                <button
                                    onClick={() => handleRollback(commit.id)}
                                    disabled={!!rollingBack}
                                    title="Restore this version"
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        cursor: rollingBack ? 'not-allowed' : 'pointer',
                                        color: isLoading ? '#7c3aed' : '#475569',
                                        padding: 2,
                                        flexShrink: 0,
                                    }}
                                >
                                    <RotateCcw size={12} />
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
