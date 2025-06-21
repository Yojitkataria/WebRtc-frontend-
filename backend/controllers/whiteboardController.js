const Whiteboard = require('../models/Whiteboard');
const Room = require('../models/Room');
const { validationResult } = require('express-validator');

// Create a new whiteboard
const createWhiteboard = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { name, description, settings } = req.body;
    const userId = req.user.id;

    const whiteboard = new Whiteboard({
      name,
      description,
      createdBy: userId,
      collaborators: [{
        user: userId,
        role: 'owner'
      }],
      settings: settings || {}
    });

    await whiteboard.save();

    res.status(201).json({
      success: true,
      data: whiteboard
    });
  } catch (error) {
    console.error('Create whiteboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create whiteboard'
    });
  }
};

// Get all whiteboards for a user
const getUserWhiteboards = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const whiteboards = await Whiteboard.find({
      $or: [
        { createdBy: userId },
        { 'collaborators.user': userId }
      ],
      isActive: true
    })
    .populate('createdBy', 'name email')
    .populate('collaborators.user', 'name email')
    .sort({ lastModified: -1 })
    .skip(skip)
    .limit(limit);

    const total = await Whiteboard.countDocuments({
      $or: [
        { createdBy: userId },
        { 'collaborators.user': userId }
      ],
      isActive: true
    });

    res.json({
      success: true,
      data: whiteboards,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get user whiteboards error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch whiteboards'
    });
  }
};

// Get a specific whiteboard
const getWhiteboard = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const whiteboard = await Whiteboard.findOne({
      _id: id,
      isActive: true,
      $or: [
        { createdBy: userId },
        { 'collaborators.user': userId }
      ]
    })
    .populate('createdBy', 'name email')
    .populate('collaborators.user', 'name email');

    if (!whiteboard) {
      return res.status(404).json({
        success: false,
        message: 'Whiteboard not found or access denied'
      });
    }

    res.json({
      success: true,
      data: whiteboard
    });
  } catch (error) {
    console.error('Get whiteboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch whiteboard'
    });
  }
};

// Update whiteboard
const updateWhiteboard = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const userId = req.user.id;
    const { name, description, settings } = req.body;

    const whiteboard = await Whiteboard.findOne({
      _id: id,
      isActive: true,
      $or: [
        { createdBy: userId },
        { 'collaborators.user': userId, 'collaborators.role': { $in: ['owner', 'editor'] } }
      ]
    });

    if (!whiteboard) {
      return res.status(404).json({
        success: false,
        message: 'Whiteboard not found or access denied'
      });
    }

    // Only owner can update name and description
    if (whiteboard.createdBy.toString() === userId) {
      if (name) whiteboard.name = name;
      if (description !== undefined) whiteboard.description = description;
    }

    if (settings) {
      whiteboard.settings = { ...whiteboard.settings, ...settings };
    }

    await whiteboard.save();

    res.json({
      success: true,
      data: whiteboard
    });
  } catch (error) {
    console.error('Update whiteboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update whiteboard'
    });
  }
};

// Delete whiteboard
const deleteWhiteboard = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const whiteboard = await Whiteboard.findOne({
      _id: id,
      createdBy: userId,
      isActive: true
    });

    if (!whiteboard) {
      return res.status(404).json({
        success: false,
        message: 'Whiteboard not found or access denied'
      });
    }

    whiteboard.isActive = false;
    await whiteboard.save();

    res.json({
      success: true,
      message: 'Whiteboard deleted successfully'
    });
  } catch (error) {
    console.error('Delete whiteboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete whiteboard'
    });
  }
};

// Add collaborator to whiteboard
const addCollaborator = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const userId = req.user.id;
    const { collaboratorId, role = 'editor' } = req.body;

    const whiteboard = await Whiteboard.findOne({
      _id: id,
      createdBy: userId,
      isActive: true
    });

    if (!whiteboard) {
      return res.status(404).json({
        success: false,
        message: 'Whiteboard not found or access denied'
      });
    }

    // Check if collaborator already exists
    const existingCollaborator = whiteboard.collaborators.find(
      c => c.user.toString() === collaboratorId
    );

    if (existingCollaborator) {
      return res.status(400).json({
        success: false,
        message: 'User is already a collaborator'
      });
    }

    whiteboard.collaborators.push({
      user: collaboratorId,
      role
    });

    await whiteboard.save();

    res.json({
      success: true,
      data: whiteboard
    });
  } catch (error) {
    console.error('Add collaborator error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add collaborator'
    });
  }
};

// Remove collaborator from whiteboard
const removeCollaborator = async (req, res) => {
  try {
    const { id, collaboratorId } = req.params;
    const userId = req.user.id;

    const whiteboard = await Whiteboard.findOne({
      _id: id,
      createdBy: userId,
      isActive: true
    });

    if (!whiteboard) {
      return res.status(404).json({
        success: false,
        message: 'Whiteboard not found or access denied'
      });
    }

    whiteboard.collaborators = whiteboard.collaborators.filter(
      c => c.user.toString() !== collaboratorId
    );

    await whiteboard.save();

    res.json({
      success: true,
      data: whiteboard
    });
  } catch (error) {
    console.error('Remove collaborator error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove collaborator'
    });
  }
};

module.exports = {
  createWhiteboard,
  getUserWhiteboards,
  getWhiteboard,
  updateWhiteboard,
  deleteWhiteboard,
  addCollaborator,
  removeCollaborator
}; 