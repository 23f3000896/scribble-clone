import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { RoomManager } from './RoomManager.js';
import { DrawStroke, RoomSettings, AvatarData } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST']
}));
app.use(express.json());

const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  pingTimeout: 30000,
  pingInterval: 10000
});

const roomManager = new RoomManager(io);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve frontend build if available (production mode)
const clientBuildPath = path.resolve(__dirname, '../../client/dist');
app.use(express.static(clientBuildPath));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
    return next();
  }
  const indexPath = path.join(clientBuildPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(200).send('Skribbl Clone Server is running. Client build not found in dist.');
    }
  });
});

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);

  // Create Room
  socket.on('create_room', (data: { hostName: string; avatar: AvatarData; settings?: Partial<RoomSettings> }) => {
    try {
      const { hostName, avatar, settings } = data || {};
      const room = roomManager.createRoom(socket, hostName || 'Player', avatar || { color: '#f59e0b', eyes: 1, mouth: 1 }, settings || {});
      console.log(`[Room] Created room: ${room.id} by ${hostName} (${socket.id})`);
    } catch (err: any) {
      socket.emit('error_message', err.message || 'Failed to create room.');
    }
  });

  // Join Room
  socket.on('join_room', (data: { roomId: string; playerName: string; avatar: AvatarData }) => {
    try {
      const { roomId, playerName, avatar } = data || {};
      if (!roomId) {
        socket.emit('error_message', 'Room ID is required.');
        return;
      }
      const result = roomManager.joinRoom(socket, roomId, playerName || 'Player', avatar || { color: '#3b82f6', eyes: 1, mouth: 1 });
      if (!result.success) {
        socket.emit('error_message', result.error || 'Failed to join room.');
      } else {
        console.log(`[Room] ${playerName} joined room: ${roomId}`);
      }
    } catch (err: any) {
      socket.emit('error_message', err.message || 'Failed to join room.');
    }
  });

  // Join Public Room
  socket.on('join_public', (data: { playerName: string; avatar: AvatarData }) => {
    try {
      const { playerName, avatar } = data || {};
      const result = roomManager.joinPublicRoom(socket, playerName || 'Player', avatar || { color: '#10b981', eyes: 1, mouth: 1 });
      console.log(`[Room] ${playerName} joined public room: ${result.room.id}`);
    } catch (err: any) {
      socket.emit('error_message', err.message || 'Failed to join public room.');
    }
  });

  // Start Game
  socket.on('start_game', () => {
    const room = roomManager.getRoomBySocketId(socket.id);
    if (room) {
      room.startGame(socket.id);
    }
  });

  // Drawer chooses word
  socket.on('choose_word', (data: { word: string }) => {
    const room = roomManager.getRoomBySocketId(socket.id);
    if (room && data?.word) {
      room.game.selectWord(socket.id, data.word);
    }
  });

  // Drawing strokes
  socket.on('draw_stroke', (stroke: DrawStroke) => {
    const room = roomManager.getRoomBySocketId(socket.id);
    if (room && stroke) {
      room.handleStroke(socket.id, stroke);
    }
  });

  // Undo stroke
  socket.on('draw_undo', () => {
    const room = roomManager.getRoomBySocketId(socket.id);
    if (room) {
      room.handleUndo(socket.id);
    }
  });

  // Clear canvas
  socket.on('draw_clear', () => {
    const room = roomManager.getRoomBySocketId(socket.id);
    if (room) {
      room.handleClear(socket.id);
    }
  });

  // Chat or Guess
  socket.on('chat_message', (data: { text: string }) => {
    const room = roomManager.getRoomBySocketId(socket.id);
    if (room && data?.text) {
      const player = room.players.get(socket.id);
      if (player) {
        room.handleChat(player, data.text);
      }
    }
  });

  // Update Settings
  socket.on('update_settings', (settings: Partial<RoomSettings>) => {
    const room = roomManager.getRoomBySocketId(socket.id);
    if (room) {
      room.updateSettings(socket.id, settings);
    }
  });

  // Toggle ready
  socket.on('toggle_ready', () => {
    const room = roomManager.getRoomBySocketId(socket.id);
    if (room) {
      room.toggleReady(socket.id);
    }
  });

  // Return to lobby
  socket.on('return_to_lobby', () => {
    const room = roomManager.getRoomBySocketId(socket.id);
    if (room) {
      room.returnToLobby(socket.id);
    }
  });

  // Kick player
  socket.on('kick_player', (data: { targetId: string }) => {
    const room = roomManager.getRoomBySocketId(socket.id);
    if (room && data?.targetId) {
      room.kickPlayer(socket.id, data.targetId);
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
    roomManager.handleDisconnect(socket.id);
  });
});

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Skribbl Clone Server listening on http://localhost:${PORT}`);
});
