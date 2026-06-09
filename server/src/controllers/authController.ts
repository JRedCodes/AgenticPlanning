import type { Request, Response } from 'express';
import { db } from '../services/db.js';
import { hashPassword, verifyPassword, signToken } from '../services/authService.js';

export async function handleRegister(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body as { email: string; password: string };

    if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required' });
        return;
    }
    if (password.length < 8) {
        res.status(400).json({ error: 'Password must be at least 8 characters' });
        return;
    }

    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if ((existing.rowCount ?? 0) > 0) {
        res.status(409).json({ error: 'Email already registered' });
        return;
    }

    const passwordHash = await hashPassword(password);
    const result = await db.query<{ id: string }>(
        'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id',
        [email, passwordHash]
    );
    const userId = result.rows[0]?.id;
    if (!userId) throw new Error('Failed to create user');

    const token = signToken({ userId, email });
    res.status(201).json({ token, user: { userId, email } });
}

export async function handleLogin(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body as { email: string; password: string };

    if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required' });
        return;
    }

    const result = await db.query<{ id: string; password_hash: string }>(
        'SELECT id, password_hash FROM users WHERE email = $1',
        [email]
    );
    const user = result.rows[0];

    // Use constant-time comparison path regardless of whether user exists
    const hash = user?.password_hash ?? '$2a$12$invalidhashpadding000000000000000000000000000000000000';
    const valid = await verifyPassword(password, hash);

    if (!user || !valid) {
        res.status(401).json({ error: 'Invalid email or password' });
        return;
    }

    const token = signToken({ userId: user.id, email });
    res.status(200).json({ token, user: { userId: user.id, email } });
}
