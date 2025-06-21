const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { protect } = require('../middleware/auth');
const roomController = require('../controllers/roomController');

// Validation middleware
const validateRoom = [
  body('whiteboardId')
    .isMongoId()
    .withMessage('Invalid whiteboard ID'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters'),
  body('isPrivate')
    .optional()
    .isBoolean()
    .withMessage('isPrivate must be a boolean'),
  body('password')
    .optional()
    .isLength({ min: 4, max: 50 })
    .withMessage('Password must be between 4 and 50 characters'),
  body('maxParticipants')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Max participants must be between 1 and 50')
];

const validateJoinRoom = [
  body('password')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Password must be between 1 and 50 characters')
];

// Routes
router.post('/', protect, validateRoom, roomController.createRoom);
router.get('/', protect, roomController.getUserRooms);
router.get('/:roomId', protect, roomController.getRoom);
router.post('/:roomId/join', protect, validateJoinRoom, roomController.joinRoom);
router.delete('/:roomId', protect, roomController.deleteRoom);

module.exports = router; 