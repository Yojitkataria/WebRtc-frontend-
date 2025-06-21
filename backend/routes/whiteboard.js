const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { protect } = require('../middleware/auth');
const whiteboardController = require('../controllers/whiteboardController');

// Validation middleware
const validateWhiteboard = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
  body('settings')
    .optional()
    .isObject()
    .withMessage('Settings must be an object')
];

const validateCollaborator = [
  body('collaboratorId')
    .isMongoId()
    .withMessage('Invalid collaborator ID'),
  body('role')
    .optional()
    .isIn(['owner', 'editor', 'viewer'])
    .withMessage('Role must be owner, editor, or viewer')
];

// Routes
router.post('/', protect, validateWhiteboard, whiteboardController.createWhiteboard);
router.get('/', protect, whiteboardController.getUserWhiteboards);
router.get('/:id', protect, whiteboardController.getWhiteboard);
router.put('/:id', protect, validateWhiteboard, whiteboardController.updateWhiteboard);
router.delete('/:id', protect, whiteboardController.deleteWhiteboard);
router.post('/:id/collaborators', protect, validateCollaborator, whiteboardController.addCollaborator);
router.delete('/:id/collaborators/:collaboratorId', protect, whiteboardController.removeCollaborator);

module.exports = router; 