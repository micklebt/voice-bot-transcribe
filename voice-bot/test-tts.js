const OpenAI = require('openai');
const AudioPipeline = require('./pipeline');
require('dotenv').config();

async function testTTSResponse() {
  console.log('🔍 Testing TTS Response Generation...');
  
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    const audioPipeline = new AudioPipeline(openai);
    
    console.log('✅ AudioPipeline created successfully');
    
    // Test TTS response generation
    console.log('🧪 Testing TTS response generation...');
    const ttsResponse = await audioPipeline.generateTTSResponse(
      'pricing_inquiry', 
      'How much do your dumpsters cost?'
    );
    
    console.log('✅ TTS Response generated successfully!');
    console.log('Response:', ttsResponse);
    
  } catch (error) {
    console.log('❌ Error in TTS response generation:');
    console.log('Error message:', error.message);
    console.log('Error stack:', error.stack);
  }
}

testTTSResponse(); 