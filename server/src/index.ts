// server/src/index.ts
import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import app from './app.js';

dotenv.config();

const server = http.createServer(app);

// WebSocket Engine Routing configuration
const io = new Server(server, {
  cors: {
    origin: '*', // Customize this to your client URL in production
    methods: ['GET', 'POST']
  }
});

// WebSocket Real-time Event Subscription Routing
io.on('connection', (socket) => {
  console.log(`User connected to real-time sync stream: ${socket.id}`);

  // Handle graph modification channel subscriptions
  socket.on('join_project', (projectId: string) => {
    socket.join(projectId);
    console.log(`Socket ${socket.id} joined synchronized viewport room: ${projectId}`);
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected from streaming interface: ${socket.id}`);
  });
});

// App Launch Controller
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Orchestration Server running smoothly on port ${PORT}`);
});