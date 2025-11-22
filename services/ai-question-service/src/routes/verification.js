const express = require('express');
const router = express.Router();
const verificationController = require('../controllers/verificationController');

/**
 * POST /api/verification/submit
 * Submit owner's answers for verification
 */
router.post('/submit', verificationController.submitVerification);

/**
 * GET /api/verification/item/:itemId
 * Get verification history for an item
 */
router.get('/item/:itemId', verificationController.getItemVerifications);

/**
 * GET /api/verification/item/:itemId/questions
 * Get item details with questions (for owner to answer)
 */
router.get('/item/:itemId/questions', verificationController.getItemQuestions);

module.exports = router;
