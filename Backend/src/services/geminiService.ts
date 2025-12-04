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
    const prompt = `You are an AI assistant for a lost and found system in Sri Lanka. Generate exactly 10 simple, quick-to-answer verification questions for video responses (5 seconds each).

Item Category: ${category}
Item Description: ${description}

IMPORTANT Context:
- This system is used in SRI LANKA
- Both the FOUNDER (who found the item) and OWNER (who lost it) will answer these questions separately
- Answers will be compared using similarity scoring to verify ownership
- Questions must be answerable in a 5-second video response
- Questions should be about OBSERVABLE details that both parties can see by looking at the item
- Keep language simple and clear for Sri Lankan users

Requirements:
1. Generate exactly 10 questions
2. Questions must be SIMPLE and QUICK to answer (one sentence response)
3. Questions must be about VISIBLE/OBSERVABLE features both founder and owner can identify
4. Include 2-3 SECURE VERIFICATION questions that only the real owner would know (but founder can also see/check)
5. Questions should help distinguish the real owner from others
6. Use simple English that Sri Lankan users can easily understand
7. Focus on:
   - Specific colors, patterns, or textures
   - Visible brand names or logos
   - Unique marks, scratches, or damages
   - Size or shape characteristics
   - Materials or finishes
   - Contents or attachments (if applicable)
   - Distinctive features only the real owner would notice
   
8. SECURE VERIFICATION details (include 2-3 of these when relevant):
   - For phones: Lock screen wallpaper, home screen wallpaper, phone case design
   - For documents: Last 4 digits of ID numbers, visible stamps or signatures
   - For wallets/bags: Total number of cards, specific card names/banks, hidden compartments
   - For keys: Total number of keys, key shapes, specific key patterns
   - For electronics: Serial number last digits, unique stickers, device name
   - For personal items: Initials, monograms, personal markings

CRITICAL - For items with MULTIPLE similar objects (like cards in wallet, keys on ring):
- ALWAYS ask for TOTAL COUNT first (e.g., "How many cards are in the wallet?")
- Then ask about SPECIFIC identifiable items by NAME/TYPE (e.g., "Is there a National ID card?", "Is there a Commercial Bank card?")
- NEVER use ambiguous terms like "first", "second", "top", "bottom" as order can vary
- Ask "What types of cards are visible?" instead of "What is the first card?"
- Ask "Are there any bank cards? If yes, which banks?" instead of "What is the first bank card?"

AVOID:
- Ambiguous positional terms: "first", "second", "top", "bottom", "left", "right"
- Complex questions requiring long explanations
- Questions about feelings, memories, or abstract details
- Questions requiring specific dates, times, or complex sequences
- Questions needing detailed backstories
- Overly technical or complicated English phrases
- Full sensitive information (only ask for partial details like "last 4 digits")

Return ONLY a JSON array of 10 questions. Format:
["Question 1?", "Question 2?", "Question 3?", ...]

Example for "Black Samsung phone":
["What color is the phone?", "What brand is it?", "Are there any cracks on the screen?", "What is the lock screen wallpaper?", "Is there a phone case on it?", "What color is the phone case?", "Are there any scratches on the back?", "How many camera lenses are on the back?", "Are there any stickers on the phone?", "What is the home screen wallpaper?"]`;

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
