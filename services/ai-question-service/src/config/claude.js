require('dotenv').config();

module.exports = {
  apiKey: process.env.CLAUDE_API_KEY,
  model: process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514',
  maxTokens: 1024,
  temperature: 0.7,
};
