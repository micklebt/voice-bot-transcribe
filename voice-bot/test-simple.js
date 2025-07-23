const OpenAI = require('openai');
require('dotenv').config();

async function testOpenAI() {
  console.log('🔍 Testing OpenAI Connection...');
  
  // Check if API key is loaded
  console.log('API Key loaded:', process.env.OPENAI_API_KEY ? 'Yes' : 'No');
  console.log('API Key starts with sk-:', process.env.OPENAI_API_KEY?.startsWith('sk-') ? 'Yes' : 'No');
  
  if (!process.env.OPENAI_API_KEY || !process.env.OPENAI_API_KEY.startsWith('sk-')) {
    console.log('❌ OpenAI API key not properly configured');
    return;
  }
  
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    console.log('✅ OpenAI client created successfully');
    
    // Test a simple chat completion
    console.log('🧪 Testing chat completion...');
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: "Say 'Hello from E-Z Rolloff!'"
        }
      ],
      max_tokens: 50
    });
    
    console.log('✅ Chat completion successful!');
    console.log('Response:', response.choices[0].message.content);
    
  } catch (error) {
    console.log('❌ Error testing OpenAI:');
    console.log('Error message:', error.message);
    console.log('Error status:', error.status);
    console.log('Error code:', error.code);
  }
}

testOpenAI(); 