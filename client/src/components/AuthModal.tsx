import { useState } from 'react';
import { useAuthStore } from '../store/authStore.ts';

export default function AuthModal() {
    const setAuth = useAuthStore((state) => state.setAuth);
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch(`/auth/${mode}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json() as { token?: string; user?: { userId: string; email: string }; error?: string };

            if (!res.ok) {
                setError(data.error ?? 'Something went wrong');
                return;
            }

            if (data.token && data.user) {
                setAuth(data.token, data.user);
            }
        } catch {
            setError('Unable to connect to server');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            width: '100vw',
            background: '#0f0f0f',
        }}>
            <div style={{
                background: '#111120',
                border: '1px solid #2d2d4e',
                borderRadius: 12,
                padding: '32px 36px',
                width: 360,
                boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
            }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#a78bfa', marginBottom: 4 }}>
                    AI Software Planner
                </div>
                <div style={{ fontSize: 13, color: '#475569', marginBottom: 28 }}>
                    {mode === 'login' ? 'Sign in to your workspace' : 'Create your workspace'}
                </div>

                {/* Mode toggle */}
                <div style={{ display: 'flex', gap: 0, marginBottom: 24, background: '#1a1a2e', borderRadius: 8, padding: 3 }}>
                    {(['login', 'register'] as const).map((m) => (
                        <button
                            key={m}
                            onClick={() => { setMode(m); setError(''); }}
                            style={{
                                flex: 1,
                                padding: '7px 0',
                                borderRadius: 6,
                                border: 'none',
                                background: mode === m ? '#7c3aed' : 'transparent',
                                color: mode === m ? '#fff' : '#64748b',
                                fontSize: 13,
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.15s',
                            }}
                        >
                            {m === 'login' ? 'Sign In' : 'Register'}
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        style={{
                            background: '#1a1a2e',
                            border: '1px solid #2d2d4e',
                            borderRadius: 8,
                            color: '#e8e8e8',
                            fontSize: 13,
                            padding: '10px 14px',
                            outline: 'none',
                        }}
                    />
                    <input
                        type="password"
                        placeholder="Password (min 8 characters)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={{
                            background: '#1a1a2e',
                            border: '1px solid #2d2d4e',
                            borderRadius: 8,
                            color: '#e8e8e8',
                            fontSize: 13,
                            padding: '10px 14px',
                            outline: 'none',
                        }}
                    />

                    {error && (
                        <div style={{ fontSize: 12, color: '#f87171', padding: '8px 12px', background: '#1a0000', borderRadius: 6 }}>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            marginTop: 4,
                            background: loading ? '#2d2d4e' : '#7c3aed',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 8,
                            padding: '11px 0',
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: loading ? 'not-allowed' : 'pointer',
                            transition: 'background 0.2s',
                        }}
                    >
                        {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
                    </button>
                </form>
            </div>
        </div>
    );
}
