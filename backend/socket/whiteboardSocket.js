const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const Room = require('../models/Room');
const Whiteboard = require('../models/Whiteboard');

let io;

const initializeSocket = (server) => {
  io = socketIo(server, {
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? ['https://your-frontend-domain.com'] 
        : ['http://localhost:3000', 'http://localhost:3001'],
      credentials: true
    }
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.userName = decoded.name;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userName} (${socket.userId})`);

    // Join a whiteboard room
    socket.on('join-whiteboard', async (data) => {
      try {
        const { roomId } = data;

        const room = await Room.findOne({
          roomId,
          isActive: true
        }).populate('whiteboardId');

        if (!room) {
          socket.emit('error', { message: 'Room not found' });
          return;
        }

        // Check if user has access to the whiteboard
        const whiteboard = room.whiteboardId;
        const hasAccess = whiteboard.createdBy.toString() === socket.userId ||
          whiteboard.collaborators.some(c => c.user.toString() === socket.userId);

        if (!hasAccess) {
          socket.emit('error', { message: 'Access denied' });
          return;
        }

        // Join the socket room
        socket.join(roomId);

        // Add or update participant
        const existingParticipantIndex = room.participants.findIndex(
          p => p.user.toString() === socket.userId
        );

        if (existingParticipantIndex >= 0) {
          room.participants[existingParticipantIndex].socketId = socket.id;
          room.participants[existingParticipantIndex].isActive = true;
        } else {
          room.participants.push({
            user: socket.userId,
            userName: socket.userName,
            socketId: socket.id,
            isActive: true
          });
        }

        await room.save();

        // Notify others in the room
        socket.to(roomId).emit('user-joined', {
          userId: socket.userId,
          userName: socket.userName
        });

        // Send current participants to the new user
        const activeParticipants = room.participants.filter(p => p.isActive);
        socket.emit('room-participants', activeParticipants);

        console.log(`${socket.userName} joined room: ${roomId}`);
      } catch (error) {
        console.error('Join whiteboard error:', error);
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    // Handle drawing actions
    socket.on('drawing-action', async (data) => {
      try {
        const { roomId, action } = data;

        // Broadcast to other users in the room
        socket.to(roomId).emit('drawing-action', {
          ...action,
          userId: socket.userId,
          userName: socket.userName,
          timestamp: new Date()
        });

        // Save action to database if it's a permanent action
        if (['draw', 'erase'].includes(action.type)) {
          const room = await Room.findOne({ roomId });
          if (room) {
            const whiteboard = await Whiteboard.findById(room.whiteboardId);
            if (whiteboard) {
              whiteboard.drawingActions.push({
                type: action.type,
                userId: socket.userId,
                userName: socket.userName,
                data: action.data,
                timestamp: new Date()
              });
              await whiteboard.save();
            }
          }
        }
      } catch (error) {
        console.error('Drawing action error:', error);
      }
    });

    // Handle clear canvas
    socket.on('clear-canvas', async (data) => {
      try {
        const { roomId } = data;

        // Broadcast to other users
        socket.to(roomId).emit('clear-canvas', {
          userId: socket.userId,
          userName: socket.userName,
          timestamp: new Date()
        });

        // Save clear action to database
        const room = await Room.findOne({ roomId });
        if (room) {
          const whiteboard = await Whiteboard.findById(room.whiteboardId);
          if (whiteboard) {
            whiteboard.drawingActions.push({
              type: 'clear',
              userId: socket.userId,
              userName: socket.userName,
              timestamp: new Date()
            });
            await whiteboard.save();
          }
        }
      } catch (error) {
        console.error('Clear canvas error:', error);
      }
    });

    // Handle undo/redo
    socket.on('undo-redo', async (data) => {
      try {
        const { roomId, action } = data;

        // Broadcast to other users
        socket.to(roomId).emit('undo-redo', {
          action,
          userId: socket.userId,
          userName: socket.userName,
          timestamp: new Date()
        });
      } catch (error) {
        console.error('Undo/redo error:', error);
      }
    });

    // Handle chat messages
    socket.on('chat-message', (data) => {
      const { roomId, message } = data;
      
      socket.to(roomId).emit('chat-message', {
        userId: socket.userId,
        userName: socket.userName,
        message,
        timestamp: new Date()
      });
    });

    // Handle user typing
    socket.on('typing', (data) => {
      const { roomId, isTyping } = data;
      
      socket.to(roomId).emit('typing', {
        userId: socket.userId,
        userName: socket.userName,
        isTyping
      });
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      try {
        // Find and update all rooms where this user was a participant
        const rooms = await Room.find({
          'participants.socketId': socket.id
        });

        for (const room of rooms) {
          const participantIndex = room.participants.findIndex(
            p => p.socketId === socket.id
          );

          if (participantIndex >= 0) {
            room.participants[participantIndex].isActive = false;
            await room.save();

            // Notify other users
            socket.to(room.roomId).emit('user-left', {
              userId: socket.userId,
              userName: socket.userName
            });
          }
        }

        console.log(`User disconnected: ${socket.userName} (${socket.userId})`);
      } catch (error) {
        console.error('Disconnect error:', error);
      }
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

module.exports = {
  initializeSocket,
  getIO
}; 