/**
 * Mock Question Generator
 * Provides pre-defined verification questions for testing without API costs
 */

const categoryQuestions = {
  Electronics: [
    "What is the exact model and storage capacity?",
    "What color is the device?",
    "Are there any scratches, dents, or cracks on the device?",
    "Does it have a protective case? What color or style?",
    "Are there any stickers, engravings, or custom markings?",
    "What is the battery health or condition?",
    "Are there any apps, wallpapers, or settings you remember?",
    "Where and when did you last use it?"
  ],
  Clothing: [
    "What is the brand and size?",
    "What is the exact color and pattern?",
    "What material is it made from?",
    "Are there any stains, tears, or repairs?",
    "What does the tag say?",
    "Are there any unique features or modifications?",
    "Where and when did you last wear it?",
    "What was in the pockets?"
  ],
  Documents: [
    "What type of document is it?",
    "What is the document number or ID?",
    "What is the issue and expiry date?",
    "What name and personal details appear on it?",
    "What is the color and condition of the cover?",
    "Are there any stamps, visas, or special markings?",
    "Where was it issued?",
    "What other documents were with it?"
  ],
  Keys: [
    "How many keys are on the keychain?",
    "What brand or type are the keys?",
    "What does the keychain look like?",
    "Are any keys labeled or marked?",
    "What color are the keys or keychain?",
    "Are there any key fobs or remote controls?",
    "What do the keys open?",
    "Where did you last have them?"
  ],
  Bags: [
    "What brand and model is the bag?",
    "What color and material is it?",
    "What size is it?",
    "How many compartments does it have?",
    "Are there any tears, stains, or damage?",
    "What items were inside?",
    "Are there any patches, pins, or decorations?",
    "Where and when did you last have it?"
  ],
  Other: [
    "What is the item exactly?",
    "What color and size is it?",
    "What is it made of?",
    "Are there any distinctive features or markings?",
    "What is its condition?",
    "Where did you last see it?",
    "When did you realize it was lost?",
    "What makes this item unique?"
  ]
};

/**
 * Generate mock verification questions
 * @param {string} category - Item category
 * @param {string} description - Item description (not used in mock, but kept for API compatibility)
 * @returns {Array<string>} Array of 8 verification questions
 */
function generateMockQuestions(category, description) {
  const questions = categoryQuestions[category] || categoryQuestions.Other;
  console.log(`📝 Generated ${questions.length} mock questions for category: ${category}`);
  return questions;
}

module.exports = {
  generateMockQuestions,
};
