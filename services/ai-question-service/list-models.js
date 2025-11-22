const axios = require('axios');

const API_KEY = 'AIzaSyAhctUjZuc02UcfW7EDqwwxErVSCeU1Ffw';

async function listModels() {
  try {
    const response = await axios.get(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`
    );
    
    console.log('Available Gemini Models:\n');
    response.data.models.forEach(model => {
      if (model.supportedGenerationMethods?.includes('generateContent')) {
        console.log(`✅ ${model.name}`);
        console.log(`   Display Name: ${model.displayName}`);
        console.log(`   Description: ${model.description}`);
        console.log('');
      }
    });
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

listModels();
