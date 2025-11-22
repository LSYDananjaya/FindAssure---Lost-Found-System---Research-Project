const db = require('../db');
const geminiClient = require('../utils/geminiClient');
const { successResponse, errorResponse } = require('../utils/responseHandler');

/**
 * Submit owner's answers and perform semantic matching
 * POST /api/verification/submit
 * @body {number} itemId - Item ID
 * @body {string} claimerId - ID of the person claiming the item
 * @body {Array} answers - Array of {questionId, answer} objects
 */
const submitVerification = async (req, res) => {
  const client = await db.getClient();

  try {
    const { itemId, claimerId, answers } = req.body;

    // Validate input
    if (!itemId || !claimerId || !answers) {
      return errorResponse(
        res,
        'itemId, claimerId, and answers are required',
        400
      );
    }

    if (!Array.isArray(answers) || answers.length === 0) {
      return errorResponse(
        res,
        'Answers must be a non-empty array',
        400
      );
    }

    // Verify item exists
    const itemCheck = await client.query(
      'SELECT id FROM items WHERE id = $1',
      [itemId]
    );

    if (itemCheck.rows.length === 0) {
      return errorResponse(res, 'Item not found', 404);
    }

    // Begin transaction
    await client.query('BEGIN');

    // Get all questions for this item with founder answers
    const questionsResult = await client.query(
      'SELECT id, question, founder_answer FROM item_questions WHERE item_id = $1 ORDER BY id',
      [itemId]
    );

    const questions = questionsResult.rows;

    // Update owner answers
    const updatePromises = answers.map((ans) => {
      const question = questions.find(q => q.id === ans.questionId);
      if (question) {
        return client.query(
          'UPDATE item_questions SET owner_answer = $1 WHERE id = $2',
          [ans.answer, ans.questionId]
        );
      }
    });

    await Promise.all(updatePromises);

    // Prepare data for semantic matching
    const questionAnswerPairs = answers.map((ans) => {
      const question = questions.find(q => q.id === ans.questionId);
      return {
        question: question.question,
        founderAnswer: question.founder_answer,
        ownerAnswer: ans.answer
      };
    });

    // Perform semantic matching using Gemini
    console.log(`🔍 Analyzing semantic match for item ${itemId}...`);
    const matchingResult = await geminiClient.analyzeAnswerMatching(questionAnswerPairs);

    // Save verification attempt
    const verificationResult = await client.query(
      `INSERT INTO verification_attempts 
       (item_id, claimer_id, match_score, match_result, is_verified) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, match_score, is_verified, created_at`,
      [
        itemId,
        claimerId,
        matchingResult.overallScore,
        JSON.stringify(matchingResult),
        matchingResult.recommendation === 'VERIFIED'
      ]
    );

    const verification = verificationResult.rows[0];

    // Commit transaction
    await client.query('COMMIT');

    console.log(`✓ Verification complete: ${matchingResult.recommendation} (${matchingResult.overallScore}% match)`);

    return successResponse(
      res,
      {
        verification: {
          id: verification.id,
          itemId,
          claimerId,
          overallScore: matchingResult.overallScore,
          recommendation: matchingResult.recommendation,
          reasoning: matchingResult.reasoning,
          matchDetails: matchingResult.matchDetails,
          isVerified: verification.is_verified,
          createdAt: verification.created_at
        }
      },
      'Verification completed successfully',
      201
    );

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error in submitVerification controller:', error);
    return errorResponse(
      res,
      'Failed to process verification',
      500,
      error.message
    );
  } finally {
    client.release();
  }
};

/**
 * Get verification history for an item
 * GET /api/verification/item/:itemId
 */
const getItemVerifications = async (req, res) => {
  try {
    const { itemId } = req.params;

    const result = await db.query(
      `SELECT 
        v.id,
        v.claimer_id,
        v.match_score,
        v.is_verified,
        v.created_at,
        v.match_result
       FROM verification_attempts v
       WHERE v.item_id = $1
       ORDER BY v.created_at DESC`,
      [itemId]
    );

    const verifications = result.rows.map(v => ({
      id: v.id,
      claimerId: v.claimer_id,
      matchScore: parseFloat(v.match_score),
      isVerified: v.is_verified,
      createdAt: v.created_at,
      matchResult: JSON.parse(v.match_result)
    }));

    return successResponse(
      res,
      { verifications, count: verifications.length },
      'Verifications retrieved successfully'
    );

  } catch (error) {
    console.error('Error in getItemVerifications controller:', error);
    return errorResponse(
      res,
      'Failed to retrieve verifications',
      500,
      error.message
    );
  }
};

/**
 * Get item with questions (for owner to answer)
 * GET /api/verification/item/:itemId/questions
 */
const getItemQuestions = async (req, res) => {
  try {
    const { itemId } = req.params;

    // Get item details
    const itemResult = await db.query(
      'SELECT id, category, description, created_at FROM items WHERE id = $1',
      [itemId]
    );

    if (itemResult.rows.length === 0) {
      return errorResponse(res, 'Item not found', 404);
    }

    const item = itemResult.rows[0];

    // Get questions (without founder answers - owner shouldn't see them!)
    const questionsResult = await db.query(
      'SELECT id, question as question_text FROM item_questions WHERE item_id = $1 ORDER BY id',
      [itemId]
    );

    return successResponse(
      res,
      {
        questions: questionsResult.rows
      },
      'Item questions retrieved successfully'
    );

  } catch (error) {
    console.error('Error in getItemQuestions controller:', error);
    return errorResponse(
      res,
      'Failed to retrieve item questions',
      500,
      error.message
    );
  }
};

module.exports = {
  submitVerification,
  getItemVerifications,
  getItemQuestions,
};
