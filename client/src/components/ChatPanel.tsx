import { useState } from 'react';
import { Send } from 'lucide-react';
import { useGraphStore } from '../store/graphStore.ts';

interface ChatPanelProps {
    projectId: string;
}

export default function ChatPanel({ projectId }: ChatPanelProps) {
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const isWorkerActive = useGraphStore((state) => state.isWorkerActive);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim() || isLoading || isWorkerActive) return;

        setIsLoading(true);
        try {
            await fetch('/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId, userId: 'user-1', message }),
            });
            setMessage('');
        } catch (err) {
            console.error('Failed to send chat:', err);
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
        }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #2d2d4e' }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#a78bfa' }}>AI Planner</div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                    {busy ? 'Generating architecture...' : 'Describe your system'}
                </div>
            </div>

            <form
                onSubmit={handleSubmit}
                style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10, marginTop: 'auto' }}
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
                    placeholder="e.g. Build me a real-time chat app with auth..."
                    disabled={busy}
                    rows={4}
                    style={{
                        resize: 'none',
                        background: '#1a1a2e',
                        border: '1px solid #2d2d4e',
                        borderRadius: 8,
                        color: '#e8e8e8',
                        fontSize: 13,
                        padding: '10px 12px',
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
                        padding: '10px 16px',
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
