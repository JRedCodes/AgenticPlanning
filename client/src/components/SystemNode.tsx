import { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { motion, AnimatePresence } from 'motion/react';
import { Code, ChevronDown, ChevronUp, Pencil, X, Plus, Check } from 'lucide-react';
import type { SystemNodeData } from '../store/graphStore.ts';
import { useNodeEdit } from '../hooks/useNodeEdit.ts';

interface SystemNodeProps {
    id: string;
    data: SystemNodeData;
}

export function SystemNode({ id, data }: SystemNodeProps) {
    const [expanded, setExpanded] = useState(false);
    const [editing, setEditing] = useState(false);
    const [title, setTitle] = useState(data.title);
    const [deps, setDeps] = useState<string[]>(data.dependencies);
    const [syntax, setSyntax] = useState(data.syntax);
    const [newDep, setNewDep] = useState('');
    const [saving, setSaving] = useState(false);
    const { saveNodeData } = useNodeEdit(id);

    const lineCount = data.syntax ? data.syntax.split('\n').length : 0;

    function openEdit() {
        setTitle(data.title);
        setDeps(data.dependencies);
        setSyntax(data.syntax);
        setEditing(true);
    }

    function cancelEdit() {
        setEditing(false);
        setNewDep('');
    }

    async function handleSave() {
        if (!title.trim() || saving) return;
        setSaving(true);
        const ok = await saveNodeData({ title: title.trim(), syntax, dependencies: deps });
        setSaving(false);
        if (ok) setEditing(false);
    }

    function addDep() {
        const trimmed = newDep.trim();
        if (trimmed && !deps.includes(trimmed)) {
            setDeps([...deps, trimmed]);
        }
        setNewDep('');
    }

    function removeDep(dep: string) {
        setDeps(deps.filter(d => d !== dep));
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25 }}
            style={{
                background: '#1a1a2e',
                border: `1px solid ${data.isStreaming ? '#7c3aed' : editing ? '#a78bfa' : '#2d2d4e'}`,
                borderRadius: 8,
                padding: '12px 14px',
                minWidth: 200,
                maxWidth: 300,
                boxShadow: data.isStreaming
                    ? '0 0 12px rgba(124,58,237,0.3)'
                    : '0 4px 20px rgba(0,0,0,0.4)',
                transition: 'border-color 0.2s, box-shadow 0.2s',
            }}
        >
            <Handle type="target" position={Position.Top} />

            {editing ? (
                // ── Edit mode ────────────────────────────────────────
                <div onMouseDown={e => e.stopPropagation()}>
                    <input
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder="Node title"
                        autoFocus
                        style={{
                            width: '100%',
                            background: '#111120',
                            border: '1px solid #2d2d4e',
                            borderRadius: 5,
                            color: '#a78bfa',
                            fontSize: 13,
                            fontWeight: 600,
                            padding: '4px 8px',
                            outline: 'none',
                            marginBottom: 8,
                            boxSizing: 'border-box',
                        }}
                    />

                    <div style={{ fontSize: 10, color: '#475569', marginBottom: 4 }}>Dependencies</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
                        {deps.map(dep => (
                            <span
                                key={dep}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 3,
                                    fontSize: 10,
                                    background: '#2d2d4e',
                                    color: '#94a3b8',
                                    borderRadius: 4,
                                    padding: '2px 4px 2px 6px',
                                }}
                            >
                                {dep}
                                <button
                                    onClick={() => removeDep(dep)}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 0, display: 'flex' }}
                                >
                                    <X size={9} />
                                </button>
                            </span>
                        ))}
                        <div style={{ display: 'flex', gap: 3 }}>
                            <input
                                value={newDep}
                                onChange={e => setNewDep(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addDep(); } }}
                                placeholder="add dep"
                                style={{
                                    width: 60,
                                    background: '#111120',
                                    border: '1px solid #2d2d4e',
                                    borderRadius: 4,
                                    color: '#94a3b8',
                                    fontSize: 10,
                                    padding: '2px 5px',
                                    outline: 'none',
                                }}
                            />
                            <button onClick={addDep} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center' }}>
                                <Plus size={10} />
                            </button>
                        </div>
                    </div>

                    <div style={{ fontSize: 10, color: '#475569', marginBottom: 4 }}>Syntax</div>
                    <textarea
                        value={syntax}
                        onChange={e => setSyntax(e.target.value)}
                        rows={6}
                        style={{
                            width: '100%',
                            background: '#0f0f1a',
                            border: '1px solid #2d2d4e',
                            borderRadius: 4,
                            color: '#e2e8f0',
                            fontSize: 10,
                            fontFamily: 'monospace',
                            padding: '6px 8px',
                            outline: 'none',
                            resize: 'vertical',
                            boxSizing: 'border-box',
                            marginBottom: 8,
                        }}
                    />

                    <div style={{ display: 'flex', gap: 6 }}>
                        <button
                            onClick={handleSave}
                            disabled={!title.trim() || saving}
                            style={{
                                flex: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 4,
                                background: '#7c3aed',
                                border: 'none',
                                borderRadius: 5,
                                color: '#fff',
                                fontSize: 11,
                                fontWeight: 600,
                                padding: '5px 0',
                                cursor: title.trim() && !saving ? 'pointer' : 'not-allowed',
                                opacity: title.trim() && !saving ? 1 : 0.5,
                            }}
                        >
                            <Check size={11} />
                            {saving ? 'Saving...' : 'Save'}
                        </button>
                        <button
                            onClick={cancelEdit}
                            style={{
                                flex: 1,
                                background: 'none',
                                border: '1px solid #2d2d4e',
                                borderRadius: 5,
                                color: '#64748b',
                                fontSize: 11,
                                padding: '5px 0',
                                cursor: 'pointer',
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            ) : (
                // ── View mode ────────────────────────────────────────
                <>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: '#a78bfa', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {data.title}
                        </div>
                        <button
                            onClick={openEdit}
                            title="Edit node"
                            style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: '#2d2d4e',
                                padding: '0 0 0 6px',
                                display: 'flex',
                                alignItems: 'center',
                                flexShrink: 0,
                            }}
                            onMouseEnter={e => (e.currentTarget.style.color = '#64748b')}
                            onMouseLeave={e => (e.currentTarget.style.color = '#2d2d4e')}
                        >
                            <Pencil size={11} />
                        </button>
                    </div>

                    {data.dependencies.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                            {data.dependencies.map((dep) => (
                                <span
                                    key={dep}
                                    style={{
                                        fontSize: 10,
                                        background: '#2d2d4e',
                                        color: '#94a3b8',
                                        borderRadius: 4,
                                        padding: '2px 6px',
                                    }}
                                >
                                    {dep}
                                </span>
                            ))}
                        </div>
                    )}

                    {data.syntax && (
                        <button
                            onClick={() => setExpanded(v => !v)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                background: 'none',
                                border: 'none',
                                color: '#64748b',
                                fontSize: 11,
                                cursor: 'pointer',
                                padding: '2px 0',
                                width: '100%',
                            }}
                        >
                            <Code size={11} />
                            <span>{lineCount} lines</span>
                            {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                        </button>
                    )}

                    <AnimatePresence>
                        {expanded && data.syntax && (
                            <motion.pre
                                key="syntax"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                                style={{
                                    marginTop: 8,
                                    fontSize: 10,
                                    lineHeight: 1.5,
                                    color: '#e2e8f0',
                                    background: '#0f0f1a',
                                    borderRadius: 4,
                                    padding: '6px 8px',
                                    overflowX: 'auto',
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-word',
                                    borderLeft: '2px solid #7c3aed',
                                    maxHeight: 240,
                                    overflowY: 'auto',
                                }}
                            >
                                {data.syntax}
                            </motion.pre>
                        )}
                    </AnimatePresence>
                </>
            )}

            <Handle type="source" position={Position.Bottom} />
        </motion.div>
    );
}
