import { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { motion } from 'motion/react';
import { Pencil, X, Plus, Check, ArrowUpRight, ArrowDownLeft, ChevronDown } from 'lucide-react';
import type { SystemNodeData } from '../store/graphStore.ts';
import { useNodeEdit, type NodeEditData } from '../hooks/useNodeEdit.ts';

interface SystemNodeProps {
    id: string;
    data: SystemNodeData;
}

function TagList({
    items,
    color,
}: {
    items: string[];
    color: string;
}) {
    if (items.length === 0) return null;
    return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            {items.map((item) => (
                <span
                    key={item}
                    style={{
                        fontSize: 10,
                        background: '#111120',
                        color,
                        borderRadius: 4,
                        padding: '2px 6px',
                        border: `1px solid ${color}22`,
                    }}
                >
                    {item}
                </span>
            ))}
        </div>
    );
}

function EditableTagList({
    items,
    onChange,
    placeholder,
}: {
    items: string[];
    onChange: (items: string[]) => void;
    placeholder: string;
}) {
    const [input, setInput] = useState('');

    function add() {
        const t = input.trim();
        if (t && !items.includes(t)) onChange([...items, t]);
        setInput('');
    }

    return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            {items.map(item => (
                <span
                    key={item}
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
                    {item}
                    <button
                        onClick={() => onChange(items.filter(i => i !== item))}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 0, display: 'flex' }}
                    >
                        <X size={9} />
                    </button>
                </span>
            ))}
            <div style={{ display: 'flex', gap: 3 }}>
                <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
                    placeholder={placeholder}
                    style={{
                        width: 80,
                        background: '#111120',
                        border: '1px solid #2d2d4e',
                        borderRadius: 4,
                        color: '#94a3b8',
                        fontSize: 10,
                        padding: '2px 5px',
                        outline: 'none',
                    }}
                />
                <button onClick={add} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center' }}>
                    <Plus size={10} />
                </button>
            </div>
        </div>
    );
}

export function SystemNode({ id, data }: SystemNodeProps) {
    const [expanded, setExpanded] = useState(false);
    const [editing, setEditing] = useState(false);
    const [title, setTitle] = useState(data.title);
    const [description, setDescription] = useState(data.description);
    const [exposes, setExposes] = useState<string[]>(data.exposes);
    const [consumes, setConsumes] = useState<string[]>(data.consumes);
    const [deps, setDeps] = useState<string[]>(data.dependencies);
    const [saving, setSaving] = useState(false);
    const { saveNodeData } = useNodeEdit(id);

    function openEdit() {
        setTitle(data.title);
        setDescription(data.description);
        setExposes(data.exposes);
        setConsumes(data.consumes);
        setDeps(data.dependencies);
        setEditing(true);
    }

    async function handleSave() {
        if (!title.trim() || saving) return;
        setSaving(true);
        const editData: NodeEditData = {
            title: title.trim(),
            description,
            exposes,
            consumes,
            dependencies: deps,
        };
        const ok = await saveNodeData(editData);
        setSaving(false);
        if (ok) setEditing(false);
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            style={{
                background: '#1a1a2e',
                border: `1px solid ${editing ? '#a78bfa' : '#2d2d4e'}`,
                borderRadius: 8,
                padding: '12px 14px',
                minWidth: 220,
                maxWidth: 300,
                boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
            }}
        >
            <Handle type="target" position={Position.Top} />

            {editing ? (
                <div onMouseDown={e => e.stopPropagation()}>
                    <input
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        autoFocus
                        placeholder="Component name"
                        style={{
                            width: '100%', background: '#111120', border: '1px solid #2d2d4e',
                            borderRadius: 5, color: '#a78bfa', fontSize: 13, fontWeight: 600,
                            padding: '4px 8px', outline: 'none', marginBottom: 8, boxSizing: 'border-box',
                        }}
                    />

                    <div style={{ fontSize: 10, color: '#475569', marginBottom: 3 }}>Description</div>
                    <textarea
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        rows={2}
                        placeholder="What does this component do?"
                        style={{
                            width: '100%', background: '#111120', border: '1px solid #2d2d4e',
                            borderRadius: 5, color: '#94a3b8', fontSize: 11, padding: '5px 8px',
                            outline: 'none', resize: 'none', boxSizing: 'border-box', marginBottom: 8,
                        }}
                    />

                    <div style={{ fontSize: 10, color: '#475569', marginBottom: 3 }}>Exposes</div>
                    <div style={{ marginBottom: 8 }}>
                        <EditableTagList items={exposes} onChange={setExposes} placeholder="POST /endpoint" />
                    </div>

                    <div style={{ fontSize: 10, color: '#475569', marginBottom: 3 }}>Consumes</div>
                    <div style={{ marginBottom: 8 }}>
                        <EditableTagList items={consumes} onChange={setConsumes} placeholder="Other service" />
                    </div>

                    <div style={{ fontSize: 10, color: '#475569', marginBottom: 3 }}>Dependencies</div>
                    <div style={{ marginBottom: 10 }}>
                        <EditableTagList items={deps} onChange={setDeps} placeholder="npm package" />
                    </div>

                    <div style={{ display: 'flex', gap: 6 }}>
                        <button
                            onClick={handleSave}
                            disabled={!title.trim() || saving}
                            style={{
                                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                gap: 4, background: '#7c3aed', border: 'none', borderRadius: 5,
                                color: '#fff', fontSize: 11, fontWeight: 600, padding: '5px 0',
                                cursor: title.trim() && !saving ? 'pointer' : 'not-allowed',
                                opacity: title.trim() && !saving ? 1 : 0.5,
                            }}
                        >
                            <Check size={11} />
                            {saving ? 'Saving...' : 'Save'}
                        </button>
                        <button
                            onClick={() => setEditing(false)}
                            style={{
                                flex: 1, background: 'none', border: '1px solid #2d2d4e',
                                borderRadius: 5, color: '#64748b', fontSize: 11, padding: '5px 0', cursor: 'pointer',
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    {/* Title row */}
                    {/* Title + action buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: data.dependencies?.length > 0 ? 6 : 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: '#a78bfa', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {data.title}
                        </div>
                        <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                            <button
                                onClick={() => setExpanded(v => !v)}
                                title={expanded ? 'Collapse' : 'Expand'}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: expanded ? '#a78bfa' : '#2d2d4e', padding: '0 2px', display: 'flex' }}
                                onMouseEnter={e => { if (!expanded) e.currentTarget.style.color = '#64748b'; }}
                                onMouseLeave={e => { if (!expanded) e.currentTarget.style.color = '#2d2d4e'; }}
                            >
                                <ChevronDown size={12} style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                            </button>
                            <button
                                onClick={openEdit}
                                title="Edit node"
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2d2d4e', padding: '0 0 0 2px', display: 'flex' }}
                                onMouseEnter={e => (e.currentTarget.style.color = '#64748b')}
                                onMouseLeave={e => (e.currentTarget.style.color = '#2d2d4e')}
                            >
                                <Pencil size={11} />
                            </button>
                        </div>
                    </div>

                    {/* Dependencies always visible */}
                    {data.dependencies?.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                            {data.dependencies.map((dep) => (
                                <span key={dep} style={{ fontSize: 10, background: '#2d2d4e', color: '#64748b', borderRadius: 4, padding: '2px 6px' }}>
                                    {dep}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Expanded detail */}
                    {expanded && (
                        <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #1f1f35' }}>
                            {data.description && (
                                <p style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.5, margin: '0 0 8px 0' }}>
                                    {data.description}
                                </p>
                            )}

                            {data.exposes?.length > 0 && (
                                <div style={{ marginBottom: 6 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}>
                                        <ArrowUpRight size={10} color="#34d399" />
                                        <span style={{ fontSize: 10, color: '#34d399', fontWeight: 600, letterSpacing: '0.04em' }}>EXPOSES</span>
                                    </div>
                                    <TagList items={data.exposes} color="#34d399" />
                                </div>
                            )}

                            {data.consumes?.length > 0 && (
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}>
                                        <ArrowDownLeft size={10} color="#60a5fa" />
                                        <span style={{ fontSize: 10, color: '#60a5fa', fontWeight: 600, letterSpacing: '0.04em' }}>CONSUMES</span>
                                    </div>
                                    <TagList items={data.consumes} color="#60a5fa" />
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}

            <Handle type="source" position={Position.Bottom} />
        </motion.div>
    );
}
