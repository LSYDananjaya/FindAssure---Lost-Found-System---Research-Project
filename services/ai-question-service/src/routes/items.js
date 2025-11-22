const express = require('express');
const { body, param } = require('express-validator');
const itemsController = require('../controllers/itemsController');
const { asyncHandler } = require('../utils/responseHandler');

const router = express.Router();

/**
 * POST /api/items/create
 * Create a new item with verification questions and founder's answers
 */
router.post(
  '/create',
  [
    body('category')
      .trim()
      .notEmpty()
      .withMessage('Category is required'),
    body('description')
      .trim()
      .notEmpty()
      .withMessage('Description is required'),
    body('founderId')
      .trim()
      .notEmpty()
      .withMessage('Founder ID is required'),
    body('questions')
      .isArray({ min: 1 })
      .withMessage('Questions must be a non-empty array'),
    body('questions.*.question')
      .trim()
      .notEmpty()
      .withMessage('Each question must have a question field'),
    body('questions.*.founderAnswer')
      .trim()
      .notEmpty()
      .withMessage('Each question must have a founderAnswer field'),
  ],
  asyncHandler(itemsController.createItem)
);

/**
 * GET /api/items/:itemId
 * Get item details by ID
 */
router.get(
  '/:itemId',
  [
    param('itemId')
      .isInt({ min: 1 })
      .withMessage('Valid item ID is required'),
  ],
  asyncHandler(itemsController.getItemById)
);

/**
 * GET /api/items
 * Get all items (for debugging/testing)
 */
router.get(
  '/',
  asyncHandler(itemsController.getAllItems)
);

module.exports = router;
