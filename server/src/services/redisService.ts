import { createClient } from 'redis';
import { REDIS_CONFIG } from '../config/redis.js';

export const redisClient = createClient({
    socket: {
        host: REDIS_CONFIG.host,
        port: REDIS_CONFIG.port,
    },
    ...(REDIS_CONFIG.password ? { password: REDIS_CONFIG.password } : {}),
});

redisClient.on('error', (err: Error) => {
    console.error('Redis client error:', err);
});

export async function connectRedis(): Promise<void> {
    await redisClient.connect();
}