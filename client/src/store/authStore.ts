import { create } from 'zustand';

export interface AuthUser {
    userId: string;
    email: string;
}

interface AuthStore {
    token: string | null;
    user: AuthUser | null;
    setAuth: (token: string, user: AuthUser) => void;
    clearAuth: () => void;
}

function loadFromStorage(): { token: string | null; user: AuthUser | null } {
    try {
        const token = localStorage.getItem('auth_token');
        const raw = localStorage.getItem('auth_user');
        if (token && raw) return { token, user: JSON.parse(raw) as AuthUser };
    } catch {}
    return { token: null, user: null };
}

export const useAuthStore = create<AuthStore>((set) => ({
    ...loadFromStorage(),

    setAuth: (token, user) => {
        localStorage.setItem('auth_token', token);
        localStorage.setItem('auth_user', JSON.stringify(user));
        set({ token, user });
    },

    clearAuth: () => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        set({ token: null, user: null });
    },
}));
