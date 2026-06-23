import { Server } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt.js';
import { User } from '../models/User.js';

let io = null;
const onlineUsers = new Map(); // projectId -> Map(userId -> { socketId, user })

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true,
      methods: ['GET', 'POST'],
    },
  });

  // Authentication middleware for socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) {
        return next(new Error('Authentication error: Token missing'));
      }

      const decoded = verifyAccessToken(token);
      if (!decoded) {
        return next(new Error('Authentication error: Token invalid or expired'));
      }

      const user = await User.findById(decoded.id).select('_id username email avatar role');
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.user = user;
      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      return next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`[Socket] User connected: ${socket.user.username} (${socket.id})`);

    // Join user-specific room for targeted notifications
    const userRoom = `user-${socket.user._id.toString()}`;
    socket.join(userRoom);
    console.log(`[Socket] User joined personal room: ${userRoom}`);

    // Join a project room
    socket.on('join-project', (projectId) => {
      if (!projectId) return;

      socket.join(projectId);
      console.log(`[Socket] User ${socket.user.username} joined project: ${projectId}`);

      // Track online users in project
      if (!onlineUsers.has(projectId)) {
        onlineUsers.set(projectId, new Map());
      }
      onlineUsers.get(projectId).set(socket.user._id.toString(), {
        socketId: socket.id,
        user: socket.user,
      });

      // Broadcast updated online members list
      emitOnlineMembers(projectId);
    });

    // Leave a project room
    socket.on('leave-project', (projectId) => {
      if (!projectId) return;

      socket.leave(projectId);
      console.log(`[Socket] User ${socket.user.username} left project: ${projectId}`);

      if (onlineUsers.has(projectId)) {
        onlineUsers.get(projectId).delete(socket.user._id.toString());
        if (onlineUsers.get(projectId).size === 0) {
          onlineUsers.delete(projectId);
        } else {
          emitOnlineMembers(projectId);
        }
      }
    });

    // Disconnect handler
    socket.on('disconnect', () => {
      console.log(`[Socket] User disconnected: ${socket.id}`);

      // Remove from all project rooms
      for (const [projectId, usersMap] of onlineUsers.entries()) {
        if (usersMap.has(socket.user._id.toString())) {
          const session = usersMap.get(socket.user._id.toString());
          if (session.socketId === socket.id) {
            usersMap.delete(socket.user._id.toString());
            if (usersMap.size === 0) {
              onlineUsers.delete(projectId);
            } else {
              emitOnlineMembers(projectId);
            }
          }
        }
      }
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

// Helper to broadcast online members
const emitOnlineMembers = (projectId) => {
  if (!io || !onlineUsers.has(projectId)) return;
  const list = Array.from(onlineUsers.get(projectId).values()).map((u) => u.user);
  io.to(projectId).emit('project-members-online', list);
};

// Helper to emit events to project room from controllers
export const emitProjectEvent = (projectId, event, data) => {
  if (!io) return;
  io.to(projectId.toString()).emit(event, data);
};
