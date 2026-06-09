import { useState, useEffect, useRef } from 'react';
import { Send, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { useGraphStore } from '../store/graphStore.ts';
import { useAuthStore } from '../store/authStore.ts';
import { authFetch } from '../lib/api.ts';
import ProjectSwitcher from './ProjectSwitcher.tsx';

interface ChatPanelProps {
    projectId: string;
}

export default function ChatPanel({ projectId }: ChatPanelProps) {
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const isWorkerActive = useGraphStore((state) => state.isWorkerActive);
    const chatMessages = useGraphStore((state) => state.chatMessages);
    const addChatMessage = useGraphStore((state) => state.addChatMessage);
    const resetGraph = useGraphStore((state) => state.reset);
    const user = useAuthStore((state) => state.user);
    const clearAuth = useAuthStore((state) => state.clearAuth);
    const logEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    function handleSignOut() {
        resetGraph();
        clearAuth();
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim() || isLoading || isWorkerActive) return;

        const trimmed = message.trim();
        setIsLoading(true);
        setMessage('');

        try {
            const res = await authFetch('/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId, message: trimmed }),
            });

            if (!res.ok) {
                toast.error('Failed to send message');
                return;
            }

            const { jobId } = await res.json() as { jobId: string };
            addChatMessage({ role: 'user', content: trimmed, jobId });
            addChatMessage({ role: 'assistant', content: 'Thinking...', jobId });
        } catch {
            toast.error('Failed to send message — is the server running?');
        } finally {
            setIsLoading(false);
        }
    };

    const busy = isLoading || isWorkerActive;

    return (
        <div style={{
            width: 320,
            display: 'flex',
            flexDirection: 'column',
            borderLeft: '1px solid #2d2d4e',
            background: '#111120',
            overflow: 'hidden',
        }}>
            {/* Header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #2d2d4e', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <ProjectSwitcher />
                    <button
                        onClick={handleSignOut}
                        title="Sign out"
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#475569',
                            padding: 4,
                            display: 'flex',
                            alignItems: 'center',
                            borderRadius: 4,
                        }}
                    >
                        <LogOut size={14} />
                    </button>
                </div>
                <div style={{ fontSize: 11, color: '#475569', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user?.email}
                </div>
            </div>

            {/* Chat log */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '12px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
            }}>
                {chatMessages.length === 0 && (
                    <div style={{ fontSize: 12, color: '#334155', textAlign: 'center', marginTop: 24 }}>
                        Describe your system to get started
                    </div>
                )}
                {chatMessages.map((msg) => (
                    <div
                        key={msg.id}
                        style={{
                            display: 'flex',
                            justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                        }}
                    >
                        <div style={{
                            maxWidth: '85%',
                            padding: '7px 11px',
                            borderRadius: msg.role === 'user' ? '12px 12px 3px 12px' : '12px 12px 12px 3px',
                            background: msg.role === 'user' ? '#7c3aed' : '#1a1a2e',
                            border: msg.role === 'user' ? 'none' : '1px solid #2d2d4e',
                            color: msg.role === 'user' ? '#fff' : '#94a3b8',
                            fontSize: 12,
                            lineHeight: 1.5,
                            wordBreak: 'break-word',
                        }}>
                            {msg.content}
                        </div>
                    </div>
                ))}
                <div ref={logEndRef} />
            </div>

            {/* Input */}
            <form
                onSubmit={handleSubmit}
                style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8, borderTop: '1px solid #2d2d4e', flexShrink: 0 }}
            >
                <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSubmit(e);
                        }
                    }}
                    placeholder="Describe changes or a new system..."
                    disabled={busy}
                    rows={3}
                    style={{
                        resize: 'none',
                        background: '#1a1a2e',
                        border: '1px solid #2d2d4e',
                        borderRadius: 8,
                        color: '#e8e8e8',
                        fontSize: 13,
                        padding: '8px 12px',
                        outline: 'none',
                        opacity: busy ? 0.5 : 1,
                    }}
                />
                <button
                    type="submit"
                    disabled={busy || !message.trim()}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        background: busy ? '#2d2d4e' : '#7c3aed',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 8,
                        padding: '9px 16px',
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: busy ? 'not-allowed' : 'pointer',
                        transition: 'background 0.2s',
                    }}
                >
                    <Send size={14} />
                    {busy ? 'Building...' : 'Generate'}
                </button>
            </form>
        </div>
    );
}
