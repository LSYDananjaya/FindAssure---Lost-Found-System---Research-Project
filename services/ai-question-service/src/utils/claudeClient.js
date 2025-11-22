const claudeConfig = require('../config/claude');

// Lazy-load Anthropic SDK
let Anthropic;
let anthropic;

function getAnthropicClient() {
  if (!anthropic) {
    // Validate API key
    if (!claudeConfig.apiKey) {
      throw new Error('Claude API key is not set in environment variables');
    }
    
    console.log('🔑 Initializing Anthropic client...');
    console.log('API Key present:', !!claudeConfig.apiKey);
    console.log('API Key length:', claudeConfig.apiKey?.length);
    
    // Import Anthropic
    Anthropic = require('@anthropic-ai/sdk');
    console.log('📦 Anthropic SDK loaded:', typeof Anthropic);
    
    // Create client
    anthropic = new Anthropic({
      apiKey: claudeConfig.apiKey,
    });
    
    console.log('✅ Anthropic client created:', typeof anthropic);
    console.log('✅ messages property:', typeof anthropic.messages);
  }
  
  return anthropic;
}

/**
 * Generate verification questions using Claude Sonnet API
 * @param {string} category - Item category (e.g., "Electronics", "Clothing")
 * @param {string} description - Detailed item description
 * @returns {Promise<Array<string>>} Array of 8-10 verification questions
 */
async function generateVerificationQuestions(category, description) {
  try {
    // Get or initialize the Anthropic client
    const client = getAnthropicClient();
    console.log('🚀 Generating questions with Claude for category:', category);
    
    const prompt = `You are an AI assistant helping create verification questions for a Lost & Found system.

Given the following item details:
- Category: ${category}
- Description: ${description}

Generate exactly 8-10 specific, detailed verification questions that would help verify the true owner of this item. 

Requirements:
1. Questions should be specific to the item described
2. Questions should ask about details that only the true owner would know
3. Include questions about physical characteristics, unique features, usage patterns, or personal details
4. Avoid yes/no questions - prefer open-ended questions
5. Questions should be practical and answerable
6. Return ONLY a JSON array of question strings, no additional text

Example format:
["What color is the item?", "Where did you last see it?", "Are there any distinguishing marks or features?"]

Generate the questions now:`;

    const message = await client.messages.create({
      model: claudeConfig.model,
      max_tokens: claudeConfig.maxTokens,
      temperature: claudeConfig.temperature,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Extract text content from response
    const responseText = message.content[0].text;
    
    // Parse JSON array from response
    const questions = JSON.parse(responseText);

    // Validate response
    if (!Array.isArray(questions) || questions.length < 8 || questions.length > 10) {
      throw new Error('Invalid number of questions generated');
    }

    return questions;

  } catch (error) {
    console.error('Error generating questions with Claude:', error);
    throw new Error(`Failed to generate verification questions: ${error.message}`);
  }
}

/**
 * Test the Claude client connection
 * @returns {Promise<boolean>} True if connection successful
 */
async function testConnection() {
  try {
    const client = getAnthropicClient();
    const message = await client.messages.create({
      model: claudeConfig.model,
      max_tokens: 50,
      messages: [
        {
          role: 'user',
          content: 'Say "Connection successful" if you can read this.',
        },
      ],
    });

    return message.content[0].text.includes('Connection successful');
  } catch (error) {
    console.error('Claude connection test failed:', error);
    return false;
  }
}

module.exports = {
  generateVerificationQuestions,
  testConnection,
};
