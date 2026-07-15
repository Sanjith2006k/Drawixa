require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const authRoutes = require('./routes/authRoutes');
const boardRoutes = require('./routes/boardRoutes');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/boards', boardRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Track live participants per board room
const roomParticipants = {}; // { boardId: [{ socketId, userName }] }

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-board', ({ boardId, userName }) => {
    socket.join(boardId);
    socket.boardId = boardId;
    socket.userName = userName;

    if (!roomParticipants[boardId]) roomParticipants[boardId] = [];
    // Remove duplicates by socketId
    roomParticipants[boardId] = roomParticipants[boardId].filter(p => p.socketId !== socket.id);
    roomParticipants[boardId].push({ socketId: socket.id, userName });

    // Broadcast updated participant list to everyone in the room
    io.to(boardId).emit('participants-update', roomParticipants[boardId]);
    console.log(`User ${userName} (${socket.id}) joined board ${boardId}`);
  });

  socket.on('canvas-update', (data) => {
    socket.to(data.boardId).emit('canvas-update', data.canvasState);
  });

  socket.on('disconnect', () => {
    const boardId = socket.boardId;
    if (boardId && roomParticipants[boardId]) {
      roomParticipants[boardId] = roomParticipants[boardId].filter(p => p.socketId !== socket.id);
      io.to(boardId).emit('participants-update', roomParticipants[boardId]);
      if (roomParticipants[boardId].length === 0) delete roomParticipants[boardId];
    }
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });
