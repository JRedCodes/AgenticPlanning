import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import app from './app.js';
import { connectRedis } from './services/redisService.js';
import { startRedisSubscriber } from './services/redisSubscriber.js';
import { createRollbackController } from './controllers/rollbackController.js';
import { createManualDragController } from './controllers/manualDragController.js';

dotenv.config();

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});

// Mount io-dependent routes after io is created
app.post('/projects/:projectId/rollback', createRollbackController(io));
app.post('/projects/:projectId/drag', createManualDragController(io));

io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.on('join_project', (projectId: string) => {
        socket.join(projectId);
        console.log(`Socket ${socket.id} joined project room: ${projectId}`);
    });

    socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
    });
});

const PORT = process.env.PORT || 5000;

async function start(): Promise<void> {
    await connectRedis();
    await startRedisSubscriber(io);
    server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

start().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
});
