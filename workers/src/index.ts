import dotenv from 'dotenv';
dotenv.config();

import { connectPublisher } from './services/redisPublisher.js';
import { createChatWorker } from './workers/chatWorker.js';

async function start(): Promise<void> {
    await connectPublisher();
    createChatWorker();
    console.log('Workers running and listening for jobs');
}

start().catch((err) => {
    console.error('Failed to start workers:', err);
    process.exit(1);
});
