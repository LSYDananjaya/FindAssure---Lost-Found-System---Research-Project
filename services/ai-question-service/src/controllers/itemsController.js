const db = require('../db');
const { successResponse, errorResponse } = require('../utils/responseHandler');

/**
 * Create a new item with verification questions and answers
 * POST /api/items/create
 * @body {string} category - Item category
 * @body {string} description - Item description
 * @body {string} founderId - ID of the person who found the item
 * @body {Array} questions - Array of {question, founderAnswer} objects
 */
const createItem = async (req, res) => {
  const client = await db.getClient();

  try {
    const { category, description, founderId, questions } = req.body;

    // Validate input
    if (!category || !description || !founderId || !questions) {
      return errorResponse(
        res,
        'Category, description, founderId, and questions are required',
        400
      );
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      return errorResponse(
        res,
        'Questions must be a non-empty array',
        400
      );
    }

    // Validate each question object
    for (const q of questions) {
      if (!q.question || !q.founderAnswer) {
        return errorResponse(
          res,
          'Each question must have both question and founderAnswer fields',
          400
        );
      }
    }

    // Begin transaction
    await client.query('BEGIN');

    // Insert item
    const itemResult = await client.query(
      `INSERT INTO items (category, description, founder_id) 
       VALUES ($1, $2, $3) 
       RETURNING id, category, description, founder_id, created_at`,
      [category, description, founderId]
    );

    const item = itemResult.rows[0];

    // Insert questions and answers
    const questionPromises = questions.map((q) =>
      client.query(
        `INSERT INTO item_questions (item_id, question, founder_answer) 
         VALUES ($1, $2, $3) 
         RETURNING id, question, founder_answer, created_at`,
        [item.id, q.question, q.founderAnswer]
      )
    );

    const questionResults = await Promise.all(questionPromises);
    const savedQuestions = questionResults.map((result) => result.rows[0]);

    // Commit transaction
    await client.query('COMMIT');

    return successResponse(
      res,
      {
        item: {
          id: item.id,
          category: item.category,
          description: item.description,
          founderId: item.founder_id,
          createdAt: item.created_at,
          questions: savedQuestions,
        },
      },
      'Item created successfully',
      201
    );

  } catch (error) {
    // Rollback transaction on error
    await client.query('ROLLBACK');
    console.error('Error in createItem controller:', error);
    return errorResponse(
      res,
      'Failed to create item',
      500,
      error.message
    );
  } finally {
    client.release();
  }
};

/**
 * Get item details by ID
 * GET /api/items/:itemId
 * @param {number} itemId - Item ID
 */
const getItemById = async (req, res) => {
  try {
    const { itemId } = req.params;

    // Validate input
    if (!itemId || isNaN(itemId)) {
      return errorResponse(res, 'Valid item ID is required', 400);
    }

    // Get item details
    const itemResult = await db.query(
      'SELECT id, category, description, founder_id, created_at, updated_at FROM items WHERE id = $1',
      [itemId]
    );

    if (itemResult.rows.length === 0) {
      return errorResponse(res, 'Item not found', 404);
    }

    const item = itemResult.rows[0];

    // Get associated questions and answers
    const questionsResult = await db.query(
      'SELECT id, question, founder_answer, created_at FROM item_questions WHERE item_id = $1 ORDER BY id',
      [itemId]
    );

    return successResponse(
      res,
      {
        item: {
          id: item.id,
          category: item.category,
          description: item.description,
          founderId: item.founder_id,
          createdAt: item.created_at,
          updatedAt: item.updated_at,
          questions: questionsResult.rows,
        },
      },
      'Item retrieved successfully'
    );

  } catch (error) {
    console.error('Error in getItemById controller:', error);
    return errorResponse(
      res,
      'Failed to retrieve item',
      500,
      error.message
    );
  }
};

/**
 * Get all items with question counts (for debugging/testing)
 * GET /api/items
 */
const getAllItems = async (req, res) => {
  try {
    // Get all items with question counts
    const result = await db.query(
      `SELECT 
        i.id, 
        i.category, 
        i.description, 
        i.founder_id, 
        i.created_at,
        COUNT(q.id) as question_count
       FROM items i
       LEFT JOIN item_questions q ON i.id = q.item_id
       GROUP BY i.id, i.category, i.description, i.founder_id, i.created_at
       ORDER BY i.created_at DESC`
    );

    return successResponse(
      res,
      { items: result.rows, count: result.rows.length },
      'Items retrieved successfully'
    );

  } catch (error) {
    console.error('Error in getAllItems controller:', error);
    return errorResponse(
      res,
      'Failed to retrieve items',
      500,
      error.message
    );
  }
};

module.exports = {
  createItem,
  getItemById,
  getAllItems,
};
