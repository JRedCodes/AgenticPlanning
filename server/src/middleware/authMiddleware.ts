import type { Request, Response, NextFunction } from 'express';
import { verifyToken, type JWTPayload } from '../services/authService.js';

export interface AuthenticatedRequest extends Request {
    user: JWTPayload;
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
    const authHeader = req.headers['authorization'];
    if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Missing or invalid authorization header' });
        return;
    }

    const token = authHeader.slice(7);
    try {
        const payload = verifyToken(token);
        (req as AuthenticatedRequest).user = payload;
        next();
    } catch {
        res.status(401).json({ error: 'Invalid or expired token' });
    }
}
