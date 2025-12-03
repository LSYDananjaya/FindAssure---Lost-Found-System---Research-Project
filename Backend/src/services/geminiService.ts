import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI - will be set when first used if API key exists
let genAI: GoogleGenerativeAI | null = null;

/**
 * Get or initialize the Gemini AI instance
 */
const getGeminiAI = (): GoogleGenerativeAI | null => {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
      console.warn('⚠️  GEMINI_API_KEY not configured or using placeholder');
      return null;
    }
    try {
      genAI = new GoogleGenerativeAI(apiKey);
      console.log('✅ Gemini AI initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Gemini AI:', error);
      return null;
    }
  }
  return genAI;
};

interface GenerateQuestionsInput {
  category: string;
  description: string;
}

/**
 * Generate verification questions using Gemini AI
 * @param category - Item category (e.g., Electronics, Clothing, etc.)
 * @param description - Item description provided by the founder
 * @returns Array of 10 verification questions
 */
export const generateVerificationQuestions = async ({
  category,
  description,
}: GenerateQuestionsInput): Promise<string[]> => {
  try {
    // Validate input
    if (!category || !description) {
      throw new Error('Category and description are required');
    }

    // Get or initialize Gemini AI instance
    const ai = getGeminiAI();
    if (!ai) {
      console.warn('GEMINI_API_KEY not configured, using fallback questions');
      return getFallbackQuestions(category);
    }

    // Get the Gemini 2.5 Flash model
    const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Create the prompt for question generation
    const prompt = `You are an AI assistant helping with a lost and found system. Generate exactly 10 specific, detailed verification questions that would help verify true ownership of an item.

Item Category: ${category}
Item Description: ${description}

Requirements:
1. Generate exactly 10 questions
2. Questions should be specific and detailed
3. Questions should help verify true ownership
4. Questions should be based on details that only the real owner would know
5. Include questions about:
   - Physical characteristics (color, size, material, condition)
   - Identifying marks or features
   - Brand/model details
   - Location and time of loss
   - Contents or attachments
   - Purchase/acquisition details
   - Usage patterns
   - Unique identifiers

Return ONLY a JSON array of 10 questions, nothing else. Format:
["Question 1?", "Question 2?", "Question 3?", ...]

Example for a wallet:
["What color is the wallet?", "What brand is the wallet?", "How many card slots does it have?", "Are there any unique marks or scratches?", "What was inside the wallet when you lost it?", "Where did you purchase the wallet?", "What is the material of the wallet?", "Are there any initials or monograms on it?", "What is the approximate size or dimensions?", "Where and when did you lose it?"]`;

    // Generate content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse the response
    let questions: string[];
    
    try {
      // Try to extract JSON from the response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        questions = JSON.parse(jsonMatch[0]);
      } else {
        // If no JSON found, try to parse the whole response
        questions = JSON.parse(text);
      }

      // Validate the response
      if (!Array.isArray(questions) || questions.length !== 10) {
        console.warn('Invalid response format from Gemini, using fallback questions');
        return getFallbackQuestions(category);
      }

      // Clean up questions (remove any numbering, extra whitespace)
      questions = questions.map((q) => 
        q.trim().replace(/^\d+[\.\)]\s*/, '')
      );

      return questions;
    } catch (parseError) {
      console.error('Error parsing Gemini response:', parseError);
      console.log('Raw response:', text);
      return getFallbackQuestions(category);
    }
  } catch (error) {
    console.error('Error generating questions with Gemini:', error);
    // Return fallback questions if AI generation fails
    return getFallbackQuestions(category);
  }
};

/**
 * Fallback questions based on category when AI is unavailable
 */
const getFallbackQuestions = (category: string): string[] => {
  const categorySpecificQuestions: Record<string, string[]> = {
    Electronics: [
      'What is the brand and model of the item?',
      'What color is the device?',
      'Are there any scratches, dents, or unique marks?',
      'What is the serial number or IMEI (if applicable)?',
      'What was the battery level when you lost it?',
      'Are there any stickers or cases on it?',
      'What was the last app or screen you were using?',
      'Where and when did you lose it?',
      'What is the storage capacity?',
      'Are there any unique wallpapers or settings?',
    ],
    Clothing: [
      'What is the color of the item?',
      'What is the brand or label?',
      'What is the size?',
      'What is the material or fabric type?',
      'Are there any stains, tears, or unique marks?',
      'Are there any unique patterns or designs?',
      'Where did you purchase it?',
      'When did you last wear it?',
      'Are there any alterations or repairs?',
      'What was in the pockets (if any)?',
    ],
    Accessories: [
      'What is the color of the accessory?',
      'What is the brand?',
      'What is the material?',
      'Are there any unique marks or engravings?',
      'What is the approximate size?',
      'Where did you get it?',
      'Are there any damages or wear patterns?',
      'When did you acquire it?',
      'Are there any special features?',
      'Where did you lose it?',
    ],
    Documents: [
      'What type of document is it?',
      'What is your full name on the document?',
      'What is the document number or ID?',
      'What is the issue date?',
      'What is the expiry date (if applicable)?',
      'What organization issued it?',
      'Are there any stamps or signatures?',
      'What color is the document or folder?',
      'Where did you lose it?',
      'What other documents were with it?',
    ],
    Bags: [
      'What color is the bag?',
      'What is the brand?',
      'What type of bag is it (backpack, handbag, etc.)?',
      'What is the material?',
      'Are there any unique marks, stains, or damages?',
      'How many compartments or pockets does it have?',
      'What was inside the bag?',
      'Are there any keychains or accessories attached?',
      'Where did you purchase it?',
      'Where and when did you lose it?',
    ],
    Jewelry: [
      'What type of jewelry is it?',
      'What metal is it made of?',
      'What is the approximate size or weight?',
      'Are there any gemstones or engravings?',
      'What is the design or style?',
      'Where did you get it?',
      'When did you acquire it?',
      'Are there any unique marks or inscriptions?',
      'What is the approximate value?',
      'Where did you lose it?',
    ],
    Keys: [
      'How many keys are on the keychain?',
      'What do the keys unlock (car, house, etc.)?',
      'What color or design is the keychain?',
      'Are there any tags or labels?',
      'What is the brand of any remote or fob?',
      'Are there any unique charms or accessories?',
      'What is the color and shape of the keys?',
      'Are there any numbers or markings on the keys?',
      'Where did you lose them?',
      'When did you last use them?',
    ],
    Books: [
      'What is the title of the book?',
      'Who is the author?',
      'What is the ISBN or edition?',
      'What color is the cover?',
      'Are there any notes or highlights inside?',
      'Is there a name written in it?',
      'What is the condition of the book?',
      'Are there any bookmarks or papers inside?',
      'Where did you purchase or get it?',
      'Where did you lose it?',
    ],
    Sports: [
      'What type of sports equipment is it?',
      'What is the brand?',
      'What color is it?',
      'What is the size or specifications?',
      'Are there any unique marks or damages?',
      'What is the condition?',
      'Where did you purchase it?',
      'Are there any accessories with it?',
      'When did you get it?',
      'Where did you lose it?',
    ],
    Other: [
      'What color is the item?',
      'What is the brand or manufacturer?',
      'What is the approximate size or dimensions?',
      'Are there any unique marks, scratches, or features?',
      'What is the material or composition?',
      'What is the condition of the item?',
      'Where did you acquire it?',
      'When did you get it?',
      'What was it used for?',
      'Where and when did you lose it?',
    ],
  };

  // Get category-specific questions or default to "Other"
  const questions = categorySpecificQuestions[category] || categorySpecificQuestions.Other;
  return questions;
};

/**
 * Test the Gemini service
 */
export const testGeminiService = async (): Promise<boolean> => {
  try {
    const testQuestions = await generateVerificationQuestions({
      category: 'Electronics',
      description: 'Black iPhone 13 Pro with a cracked screen protector',
    });

    return testQuestions.length === 10;
  } catch (error) {
    console.error('Gemini service test failed:', error);
    return false;
  }
};
