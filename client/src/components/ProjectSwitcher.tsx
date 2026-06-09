import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Plus, FolderOpen } from 'lucide-react';
import { useGraphStore } from '../store/graphStore.ts';
import { useProjects } from '../hooks/useProjects.ts';

export default function ProjectSwitcher() {
    const projectId = useGraphStore((state) => state.projectId);
    const { projects, handleSwitch, createProject } = useProjects();
    const [open, setOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [newName, setNewName] = useState('');
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const currentProject = projects.find(p => p.id === projectId);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setOpen(false);
                setCreating(false);
                setNewName('');
            }
        }
        if (open) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [open]);

    useEffect(() => {
        if (creating) inputRef.current?.focus();
    }, [creating]);

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        if (!newName.trim() || loading) return;
        setLoading(true);
        try {
            await createProject(newName.trim());
            setOpen(false);
            setCreating(false);
            setNewName('');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button
                onClick={() => setOpen(v => !v)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '2px 0',
                    color: '#e8e8e8',
                    maxWidth: 180,
                }}
            >
                <FolderOpen size={12} color="#a78bfa" />
                <span style={{
                    fontSize: 13,
                    fontWeight: 600,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                }}>
                    {currentProject?.name ?? 'My Project'}
                </span>
                <ChevronDown size={11} color="#64748b" style={{ flexShrink: 0 }} />
            </button>

            {open && (
                <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    left: 0,
                    width: 220,
                    background: '#1a1a2e',
                    border: '1px solid #2d2d4e',
                    borderRadius: 8,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                    zIndex: 100,
                    overflow: 'hidden',
                }}>
                    {projects.map(p => (
                        <button
                            key={p.id}
                            onClick={() => { handleSwitch(p.id); setOpen(false); }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                width: '100%',
                                padding: '9px 14px',
                                background: p.id === projectId ? '#2d2d4e' : 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                color: '#e8e8e8',
                                fontSize: 13,
                                textAlign: 'left',
                                borderBottom: '1px solid #111120',
                            }}
                        >
                            <Check size={12} color={p.id === projectId ? '#a78bfa' : 'transparent'} style={{ flexShrink: 0 }} />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {p.name}
                            </span>
                        </button>
                    ))}

                    <div style={{ padding: '6px 8px', borderTop: projects.length > 0 ? '1px solid #2d2d4e' : 'none' }}>
                        {creating ? (
                            <form onSubmit={handleCreate} style={{ display: 'flex', gap: 6 }}>
                                <input
                                    ref={inputRef}
                                    value={newName}
                                    onChange={e => setNewName(e.target.value)}
                                    placeholder="Project name"
                                    disabled={loading}
                                    style={{
                                        flex: 1,
                                        background: '#111120',
                                        border: '1px solid #2d2d4e',
                                        borderRadius: 5,
                                        color: '#e8e8e8',
                                        fontSize: 12,
                                        padding: '5px 8px',
                                        outline: 'none',
                                    }}
                                />
                                <button
                                    type="submit"
                                    disabled={!newName.trim() || loading}
                                    style={{
                                        background: '#7c3aed',
                                        border: 'none',
                                        borderRadius: 5,
                                        color: '#fff',
                                        fontSize: 12,
                                        padding: '5px 10px',
                                        cursor: newName.trim() && !loading ? 'pointer' : 'not-allowed',
                                        opacity: newName.trim() && !loading ? 1 : 0.5,
                                    }}
                                >
                                    {loading ? '...' : 'Create'}
                                </button>
                            </form>
                        ) : (
                            <button
                                onClick={() => setCreating(true)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    width: '100%',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: '#64748b',
                                    fontSize: 12,
                                    padding: '5px 6px',
                                    borderRadius: 5,
                                }}
                            >
                                <Plus size={12} />
                                New project
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
