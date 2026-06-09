import { Queue } from 'bullmq';
import { REDIS_CONFIG } from '../config/redis.js';
import type { ChatJobData } from '@project/shared';

export type { ChatJobData };

export const chatQueue = new Queue<ChatJobData>('chat', {
    connection: REDIS_CONFIG,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000,
        },
        removeOnComplete: 100,
        removeOnFail: 500,
    },
});