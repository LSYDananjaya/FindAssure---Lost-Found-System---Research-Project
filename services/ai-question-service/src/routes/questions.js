const express = require('express');
const { body } = require('express-validator');
const questionsController = require('../controllers/questionsController');
const { asyncHandler } = require('../utils/responseHandler');

const router = express.Router();

/**
 * POST /api/questions/generate
 * Generate verification questions using Claude AI
 */
router.post(
  '/generate',
  [
    body('category')
      .trim()
      .notEmpty()
      .withMessage('Category is required')
      .isLength({ max: 100 })
      .withMessage('Category must be less than 100 characters'),
    body('description')
      .trim()
      .notEmpty()
      .withMessage('Description is required')
      .isLength({ min: 10 })
      .withMessage('Description must be at least 10 characters long'),
  ],
  asyncHandler(questionsController.generateQuestions)
);

module.exports = router;
