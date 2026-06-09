import { createClient } from 'redis';
import { REDIS_CONFIG } from '../config/redis.js';
import type { WorkerEvent } from '@project/shared';

const publisher = createClient({
    socket: {
        host: REDIS_CONFIG.host,
        port: REDIS_CONFIG.port,
    },
    ...(REDIS_CONFIG.password ? { password: REDIS_CONFIG.password } : {}),
});

publisher.on('error', (err: Error) => {
    console.error('Redis publisher error:', err);
});

export async function connectPublisher(): Promise<void> {
    await publisher.connect();
    console.log('Redis publisher connected');
}

export async function publishEvent(projectId: string, event: WorkerEvent): Promise<void> {
    await publisher.publish(`project:${projectId}`, JSON.stringify(event));
}
