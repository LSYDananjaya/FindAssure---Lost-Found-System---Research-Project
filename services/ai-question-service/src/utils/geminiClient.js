const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');

/**
 * Google Gemini API Client for Semantic Answer Matching
 */
class GeminiClient {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    
    if (!this.apiKey) {
      console.warn('⚠️  GEMINI_API_KEY not found. Semantic matching will use mock data.');
      this.enabled = false;
    } else {
      try {
        this.genAI = new GoogleGenerativeAI(this.apiKey);
        // Using gemini-2.5-flash - stable and available
        this.model = this.genAI.getGenerativeModel({ 
          model: 'gemini-2.5-flash'
        });
        this.enabled = true;
        console.log('✓ Gemini API initialized with model: gemini-2.5-flash');
      } catch (error) {
        console.error('❌ Error initializing Gemini:', error.message);
        this.enabled = false;
      }
    }
  }

  /**
   * Analyze semantic similarity between founder and owner answers
   * @param {Array} questionAnswers - Array of {question, founderAnswer, ownerAnswer}
   * @returns {Promise<Object>} - {overallScore, matchDetails, recommendation}
   */
  async analyzeAnswerMatching(questionAnswers) {
    if (!this.enabled) {
      return this.getMockMatchingResult(questionAnswers);
    }

    try {
      const prompt = this.buildMatchingPrompt(questionAnswers);
      
      // Use direct REST API with v1beta endpoint - gemini-2.5-flash is stable and available
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.apiKey}`,
        {
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            topK: 20,
            topP: 0.8,
            maxOutputTokens: 2048,
          }
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      let text = response.data.candidates[0].content.parts[0].text.trim();
      
      // Remove markdown code blocks if present
      text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      
      // Parse the JSON response
      const analysis = JSON.parse(text);
      
      return {
        overallScore: analysis.overallScore || 0,
        matchDetails: analysis.matchDetails || [],
        recommendation: analysis.recommendation || 'Unable to verify',
        reasoning: analysis.reasoning || '',
      };

    } catch (error) {
      console.error('Error in Gemini answer matching:', error.response?.data || error.message);
      // Fallback to mock on error
      return this.getMockMatchingResult(questionAnswers);
    }
  }

  /**
   * Build prompt for Gemini to analyze answer matching
   */
  buildMatchingPrompt(questionAnswers) {
    const qaList = questionAnswers.map((qa, index) => 
      `Question ${index + 1}: ${qa.question}
      Founder's Answer: "${qa.founderAnswer}"
      Owner's Answer: "${qa.ownerAnswer}"`
    ).join('\n\n');

    return `You are an AI assistant helping verify the true owner of a lost item by comparing answers to verification questions.

The person who FOUND the item (founder) answered questions about the item.
A person claiming to be the OWNER has also answered the same questions.

Your task is to analyze the semantic similarity between their answers and determine if they are describing the same item.

Questions and Answers:
${qaList}

Analyze each answer pair and provide a JSON response with this exact structure:
{
  "overallScore": <number 0-100>,
  "matchDetails": [
    {
      "questionNumber": 1,
      "question": "<the question>",
      "similarityScore": <number 0-100>,
      "analysis": "<brief explanation of match/mismatch>",
      "isMatch": <true/false>
    }
  ],
  "recommendation": "<VERIFIED | LIKELY_MATCH | UNCERTAIN | NOT_MATCH>",
  "reasoning": "<overall explanation why you made this recommendation>"
}

Important considerations:
- Focus on SEMANTIC meaning, not exact word matching
- Different wordings can mean the same thing (e.g., "blue" vs "navy colored")
- Consider approximations (e.g., "6 inches" vs "about 15cm" are similar)
- Minor details can differ, but core characteristics should match
- If 70%+ questions match semantically, recommend VERIFIED
- If 50-70% match, recommend LIKELY_MATCH
- If 30-50% match, recommend UNCERTAIN
- If <30% match, recommend NOT_MATCH

Return ONLY the JSON object, no additional text.`;
  }

  /**
   * Generate mock matching result (when API key not available)
   */
  getMockMatchingResult(questionAnswers) {
    console.log('📝 Using mock semantic matching (no Gemini API key)');
    
    // Simple keyword-based matching for mock
    const matchDetails = questionAnswers.map((qa, index) => {
      const founderLower = qa.founderAnswer.toLowerCase();
      const ownerLower = qa.ownerAnswer.toLowerCase();
      
      // Very simple similarity check
      const founderWords = founderLower.split(/\s+/);
      const ownerWords = ownerLower.split(/\s+/);
      const commonWords = founderWords.filter(w => ownerWords.includes(w) && w.length > 2);
      
      const similarityScore = Math.min(100, (commonWords.length / Math.max(founderWords.length, ownerWords.length)) * 100);
      
      return {
        questionNumber: index + 1,
        question: qa.question,
        similarityScore: Math.round(similarityScore),
        analysis: similarityScore > 60 
          ? 'Answers show good semantic match'
          : similarityScore > 30
          ? 'Answers show partial match'
          : 'Answers differ significantly',
        isMatch: similarityScore > 60
      };
    });

    const overallScore = Math.round(
      matchDetails.reduce((sum, m) => sum + m.similarityScore, 0) / matchDetails.length
    );

    let recommendation;
    if (overallScore >= 70) recommendation = 'VERIFIED';
    else if (overallScore >= 50) recommendation = 'LIKELY_MATCH';
    else if (overallScore >= 30) recommendation = 'UNCERTAIN';
    else recommendation = 'NOT_MATCH';

    return {
      overallScore,
      matchDetails,
      recommendation,
      reasoning: `Mock analysis: ${overallScore}% overall similarity. ${matchDetails.filter(m => m.isMatch).length}/${matchDetails.length} questions matched.`
    };
  }
}

// Export singleton instance
module.exports = new GeminiClient();
