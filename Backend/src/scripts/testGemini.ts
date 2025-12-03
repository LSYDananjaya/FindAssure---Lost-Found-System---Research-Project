import dotenv from 'dotenv';
import { generateVerificationQuestions } from '../services/geminiService';

// Load environment variables
dotenv.config();

/**
 * Test script to verify Gemini AI integration
 */
async function testGeminiIntegration() {
  console.log('🧪 Testing Gemini AI Integration...\n');
  
  // Check API key
  console.log('1️⃣ Checking API Key Configuration:');
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('❌ GEMINI_API_KEY not found in environment variables');
    console.log('📝 Please add GEMINI_API_KEY to your .env file');
    process.exit(1);
  }
  console.log(`✅ API Key found: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}`);
  console.log('');

  // Test question generation
  console.log('2️⃣ Testing Question Generation:');
  const testCases = [
    {
      category: 'Electronics',
      description: 'Black iPhone 13 Pro with a cracked screen protector',
    },
    {
      category: 'Bags',
      description: 'Brown leather backpack with laptop compartment',
    },
    {
      category: 'Keys',
      description: 'Car keys with BMW logo keychain',
    },
  ];

  for (const testCase of testCases) {
    console.log(`\n📱 Testing: ${testCase.category} - "${testCase.description}"`);
    console.log('⏳ Generating questions...');
    
    try {
      const startTime = Date.now();
      const questions = await generateVerificationQuestions(testCase);
      const duration = Date.now() - startTime;
      
      console.log(`✅ Generated ${questions.length} questions in ${duration}ms`);
      console.log('\nGenerated Questions:');
      questions.forEach((q, i) => {
        console.log(`   ${i + 1}. ${q}`);
      });
      
      // Check if questions are AI-generated or fallback
      const fallbackIndicators = [
        'What is the brand and model of the item?',
        'What color is the device?',
        'Are there any scratches, dents, or unique marks?',
      ];
      
      const isFallback = fallbackIndicators.some(fb => questions.includes(fb));
      if (isFallback && testCase.category === 'Electronics') {
        console.log('\n⚠️  WARNING: These appear to be fallback questions, not AI-generated');
        console.log('   This means the Gemini API call may have failed');
      } else {
        console.log('\n✨ Questions appear to be AI-generated!');
      }
      
    } catch (error: any) {
      console.error(`❌ Error: ${error.message}`);
      if (error.stack) {
        console.error(error.stack);
      }
    }
  }

  console.log('\n✅ Test completed!');
  process.exit(0);
}

// Run the test
testGeminiIntegration().catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
