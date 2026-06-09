import { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { motion, AnimatePresence } from 'motion/react';
import { Code, ChevronDown, ChevronUp } from 'lucide-react';
import type { SystemNodeData } from '../store/graphStore.ts';

interface SystemNodeProps {
    data: SystemNodeData;
}

export function SystemNode({ data }: SystemNodeProps) {
    const [expanded, setExpanded] = useState(false);
    const lineCount = data.syntax ? data.syntax.split('\n').length : 0;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25 }}
            style={{
                background: '#1a1a2e',
                border: `1px solid ${data.isStreaming ? '#7c3aed' : '#2d2d4e'}`,
                borderRadius: 8,
                padding: '12px 14px',
                minWidth: 200,
                maxWidth: 280,
                boxShadow: data.isStreaming
                    ? '0 0 12px rgba(124,58,237,0.3)'
                    : '0 4px 20px rgba(0,0,0,0.4)',
                transition: 'border-color 0.2s, box-shadow 0.2s',
            }}
        >
            <Handle type="target" position={Position.Top} />

            <div style={{ fontWeight: 600, fontSize: 13, color: '#a78bfa', marginBottom: 6 }}>
                {data.title}
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
                    onClick={() => setExpanded((v) => !v)}
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

            <Handle type="source" position={Position.Bottom} />
        </motion.div>
    );
}
