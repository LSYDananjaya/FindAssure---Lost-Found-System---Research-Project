import dotenv from 'dotenv';
import { generateVerificationQuestions } from '../services/geminiService';

dotenv.config();

async function testWallet() {
  console.log('🧪 Testing Wallet Questions (No Ambiguous Positions)...\n');
  
  const questions = await generateVerificationQuestions({
    category: 'Accessories',
    description: 'Brown leather wallet with multiple ID cards and bank cards'
  });
  
  console.log('✅ Generated Questions:\n');
  questions.forEach((q, i) => {
    console.log(`   ${i + 1}. ${q}`);
    
    // Check for ambiguous terms
    const ambiguousTerms = ['first', 'second', 'third', 'top', 'bottom', 'left', 'right'];
    const hasAmbiguous = ambiguousTerms.some(term => q.toLowerCase().includes(term));
    if (hasAmbiguous) {
      console.log('      ⚠️  WARNING: Contains ambiguous positional term!');
    }
  });
}

testWallet().catch(console.error);
