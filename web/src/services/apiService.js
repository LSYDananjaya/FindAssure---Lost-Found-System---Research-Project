import axios from 'axios';

// Base URL - Update this to match your backend server
const BASE_URL = 'http://localhost:3000';

// API endpoints
const ENDPOINTS = {
  generateQuestions: '/api/questions/generate',
  createItem: '/api/items/create',
  getItem: '/api/items',
  verification: '/api/verification',
  health: '/health',
};

/**
 * Generate verification questions using AI
 * @param {string} category - Item category
 * @param {string} description - Item description
 * @returns {Promise<string[]>} Array of generated questions
 */
export const generateQuestions = async (category, description) => {
  try {
    const response = await axios.post(
      `${BASE_URL}${ENDPOINTS.generateQuestions}`,
      {
        category,
        description,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data.success && response.data.data) {
      return response.data.data.questions;
    } else {
      throw new Error(response.data.message || 'Failed to generate questions');
    }
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || 'Server error');
    } else if (error.request) {
      throw new Error('Cannot connect to server. Please ensure the backend is running.');
    } else {
      throw new Error(error.message || 'Failed to generate questions');
    }
  }
};

/**
 * Create a new item with questions and answers
 * @param {Object} item - Item object
 * @returns {Promise<Object>} Created item with ID
 */
export const createItem = async (item) => {
  try {
    const response = await axios.post(
      `${BASE_URL}${ENDPOINTS.createItem}`,
      item,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data.success && response.data.data) {
      return response.data.data.item;
    } else {
      throw new Error(response.data.message || 'Failed to create item');
    }
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || 'Server error');
    } else if (error.request) {
      throw new Error('Cannot connect to server. Please ensure the backend is running.');
    } else {
      throw new Error(error.message || 'Failed to create item');
    }
  }
};

/**
 * Get item by ID
 * @param {number} itemId - Item ID
 * @returns {Promise<Object>} Item object
 */
export const getItemById = async (itemId) => {
  try {
    const response = await axios.get(`${BASE_URL}${ENDPOINTS.getItem}/${itemId}`);

    if (response.data.success && response.data.data) {
      return response.data.data.item;
    } else {
      throw new Error(response.data.message || 'Failed to get item');
    }
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || 'Server error');
    } else if (error.request) {
      throw new Error('Cannot connect to server');
    } else {
      throw new Error(error.message || 'Failed to get item');
    }
  }
};

/**
 * Get all items
 * @returns {Promise<Array>} Array of items
 */
export const getAllItems = async () => {
  try {
    const response = await axios.get(`${BASE_URL}${ENDPOINTS.getItem}`);

    if (response.data.success && response.data.data) {
      return response.data.data.items;
    } else {
      throw new Error(response.data.message || 'Failed to get items');
    }
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || 'Server error');
    } else if (error.request) {
      throw new Error('Cannot connect to server');
    } else {
      throw new Error(error.message || 'Failed to get items');
    }
  }
};

/**
 * Get item questions for owner to answer (without founder's answers)
 * @param {number} itemId - Item ID
 * @returns {Promise<Array>} Array of questions
 */
export const getItemQuestions = async (itemId) => {
  try {
    const response = await axios.get(
      `${BASE_URL}${ENDPOINTS.verification}/item/${itemId}/questions`
    );

    if (response.data.success && response.data.data) {
      return response.data.data.questions;
    } else {
      throw new Error(response.data.message || 'Failed to get questions');
    }
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || 'Server error');
    } else if (error.request) {
      throw new Error('Cannot connect to server');
    } else {
      throw new Error(error.message || 'Failed to get questions');
    }
  }
};

/**
 * Submit verification with owner's answers
 * @param {Object} verificationData - { itemId, claimerId, answers: [{ questionId, answer }] }
 * @returns {Promise<Object>} Verification result with match score
 */
export const submitVerification = async (verificationData) => {
  try {
    const response = await axios.post(
      `${BASE_URL}${ENDPOINTS.verification}/submit`,
      verificationData,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Failed to submit verification');
    }
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || 'Server error');
    } else if (error.request) {
      throw new Error('Cannot connect to server');
    } else {
      throw new Error(error.message || 'Failed to submit verification');
    }
  }
};

/**
 * Get verification history for an item
 * @param {number} itemId - Item ID
 * @returns {Promise<Array>} Array of verification attempts
 */
export const getVerifications = async (itemId) => {
  try {
    const response = await axios.get(
      `${BASE_URL}${ENDPOINTS.verification}/item/${itemId}`
    );

    if (response.data.success && response.data.data) {
      return response.data.data.verifications;
    } else {
      throw new Error(response.data.message || 'Failed to get verifications');
    }
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || 'Server error');
    } else if (error.request) {
      throw new Error('Cannot connect to server');
    } else {
      throw new Error(error.message || 'Failed to get verifications');
    }
  }
};

/**
 * Check backend health
 * @returns {Promise<boolean>} Health status
 */
export const checkHealth = async () => {
  try {
    const response = await axios.get(`${BASE_URL}${ENDPOINTS.health}`);
    return response.status === 200;
  } catch (error) {
    return false;
  }
};
