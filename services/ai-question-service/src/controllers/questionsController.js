const claudeClient = require('../utils/claudeClient');
const mockGenerator = require('../utils/mockQuestionGenerator');
const { successResponse, errorResponse } = require('../utils/responseHandler');

/**
 * Generate AI-powered verification questions
 * POST /api/questions/generate
 * @body {string} category - Item category
 * @body {string} description - Item description
 */
const generateQuestions = async (req, res) => {
  try {
    const { category, description } = req.body;

    // Validate input
    if (!category || !description) {
      return errorResponse(
        res,
        'Category and description are required',
        400
      );
    }

    if (description.length < 10) {
      return errorResponse(
        res,
        'Description must be at least 10 characters long',
        400
      );
    }

    // Check question generation mode
    const questionMode = process.env.QUESTION_MODE || 'mock';
    let questions;
    let mode;

    if (questionMode === 'claude') {
      // Generate questions using Claude API
      console.log('🤖 Using Claude API for question generation');
      questions = await claudeClient.generateVerificationQuestions(
        category,
        description
      );
      mode = 'claude';
    } else {
      // Generate questions using mock data (free)
      console.log('📝 Using mock data for question generation');
      questions = mockGenerator.generateMockQuestions(
        category,
        description
      );
      mode = 'mock';
    }

    return successResponse(
      res,
      { questions, mode },
      'Questions generated successfully',
      200
    );

  } catch (error) {
    console.error('Error in generateQuestions controller:', error);
    return errorResponse(
      res,
      'Failed to generate verification questions',
      500,
      error.message
    );
  }
};

module.exports = {
  generateQuestions,
};
