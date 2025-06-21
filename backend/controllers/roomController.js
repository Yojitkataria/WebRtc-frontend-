const Room = require('../models/Room');
const Whiteboard = require('../models/Whiteboard');
const { v4: uuidv4 } = require('uuid');
const { validationResult } = require('express-validator');

// Create a new room
const createRoom = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { whiteboardId, name, isPrivate, password, maxParticipants } = req.body;
    const userId = req.user.id;

    // Verify user has access to the whiteboard
    const whiteboard = await Whiteboard.findOne({
      _id: whiteboardId,
      isActive: true,
      $or: [
        { createdBy: userId },
        { 'collaborators.user': userId }
      ]
    });

    if (!whiteboard) {
      return res.status(404).json({
        success: false,
        message: 'Whiteboard not found or access denied'
      });
    }

    const roomId = uuidv4();
    const room = new Room({
      roomId,
      name: name || `${whiteboard.name} Session`,
      whiteboardId,
      createdBy: userId,
      isPrivate,
      password: isPrivate ? password : undefined,
      maxParticipants: maxParticipants || 10
    });

    await room.save();

    res.status(201).json({
      success: true,
      data: room
    });
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create room'
    });
  }
};

// Get all rooms for a user
const getUserRooms = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const rooms = await Room.find({
      createdBy: userId,
      isActive: true
    })
    .populate('whiteboardId', 'name description')
    .populate('createdBy', 'name email')
    .sort({ lastActivity: -1 })
    .skip(skip)
    .limit(limit);

    const total = await Room.countDocuments({
      createdBy: userId,
      isActive: true
    });

    res.json({
      success: true,
      data: rooms,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get user rooms error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch rooms'
    });
  }
};

// Get a specific room
const getRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;

    const room = await Room.findOne({
      roomId,
      isActive: true
    })
    .populate('whiteboardId', 'name description createdBy collaborators')
    .populate('createdBy', 'name email')
    .populate('participants.user', 'name email');

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Check if user has access to the whiteboard
    const whiteboard = room.whiteboardId;
    const hasAccess = whiteboard.createdBy.toString() === userId ||
      whiteboard.collaborators.some(c => c.user.toString() === userId);

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this room'
      });
    }

    res.json({
      success: true,
      data: room
    });
  } catch (error) {
    console.error('Get room error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch room'
    });
  }
};

// Join a room
const joinRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { password } = req.body;
    const userId = req.user.id;
    const userName = req.user.name;

    const room = await Room.findOne({
      roomId,
      isActive: true
    })
    .populate('whiteboardId', 'name description createdBy collaborators');

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Check if room is private and password is required
    if (room.isPrivate && room.password !== password) {
      return res.status(401).json({
        success: false,
        message: 'Invalid room password'
      });
    }

    // Check if user has access to the whiteboard
    const whiteboard = room.whiteboardId;
    const hasAccess = whiteboard.createdBy.toString() === userId ||
      whiteboard.collaborators.some(c => c.user.toString() === userId);

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this room'
      });
    }

    // Check if room is full
    const activeParticipants = room.participants.filter(p => p.isActive);
    if (activeParticipants.length >= room.maxParticipants) {
      return res.status(400).json({
        success: false,
        message: 'Room is full'
      });
    }

    // Check if user is already in the room
    const existingParticipant = room.participants.find(
      p => p.user.toString() === userId && p.isActive
    );

    if (existingParticipant) {
      return res.status(400).json({
        success: false,
        message: 'User is already in the room'
      });
    }

    res.json({
      success: true,
      data: room,
      message: 'Room access granted'
    });
  } catch (error) {
    console.error('Join room error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to join room'
    });
  }
};

// Delete a room
const deleteRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;

    const room = await Room.findOne({
      roomId,
      createdBy: userId,
      isActive: true
    });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found or access denied'
      });
    }

    room.isActive = false;
    await room.save();

    res.json({
      success: true,
      message: 'Room deleted successfully'
    });
  } catch (error) {
    console.error('Delete room error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete room'
    });
  }
};

module.exports = {
  createRoom,
  getUserRooms,
  getRoom,
  joinRoom,
  deleteRoom
}; 