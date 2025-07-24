const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const twilio = require('twilio');
const OpenAI = require('openai');
const axios = require('axios');
const AudioPipeline = require('./pipeline');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Initialize OpenAI (only if API key is provided)
let openai = null;
if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here') {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
} else {
  console.log('⚠️  OpenAI API key not configured. Transcription features will be limited.');
}

// Initialize Twilio client (only if credentials are provided)
let twilioClient = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_ACCOUNT_SID !== 'your_twilio_account_sid_here') {
  twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
} else {
  console.log('⚠️  Twilio credentials not configured. Voice features will be limited.');
}

// Initialize Audio Pipeline (only if OpenAI is configured)
let audioPipeline = null;
if (openai) {
  audioPipeline = new AudioPipeline(openai);
} else {
  console.log('⚠️  Audio pipeline not initialized due to missing OpenAI configuration.');
}

// Middleware
app.use(helmet());
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Test endpoint for TTS response generation
app.post('/test-tts', async (req, res) => {
  try {
    const { intent, userText } = req.body;
    
    if (!intent || !userText) {
      return res.status(400).json({ error: 'Missing intent or userText' });
    }

    const ttsResponse = await audioPipeline.generateTTSResponse(intent, userText);
    
    res.json({
      intent,
      userText,
      ttsResponse,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in test TTS:', error);
    res.status(500).json({ error: 'Error generating test TTS response' });
  }
});

// Twilio webhook for incoming calls
app.post('/webhook/voice', async (req, res) => {
  try {
    if (!twilioClient) {
      return res.status(503).send('Twilio service not configured');
    }
    
    const twiml = new twilio.twiml.VoiceResponse();
    
    // Professional greeting with TTS
    const greeting = `Hello and welcome to E-Z Rolloff! Thank you for calling us today. We're here to help with all your rolloff dumpster needs. How can we assist you today? You can ask about our pricing, service areas, or if you're ready, we can take your order right now.`;
    
    twiml.say({
      voice: 'alice',
      language: 'en-US',
      rate: '0.9'
    }, greeting);
    
    // Use Gather to listen for user input
    const gather = twiml.gather({
      input: 'speech',
      language: 'en-US',
      speechTimeout: 'auto',
      action: `${process.env.RENDER_EXTERNAL_URL || `http://localhost:${port}`}/process-speech`,
      method: 'POST'
    });
    
    // If no input is received, repeat the options
    gather.say({
      voice: 'alice',
      language: 'en-US'
    }, 'Please let us know how we can help you today.');
    
    // If gather times out, redirect to process-speech
    twiml.redirect(`${process.env.RENDER_EXTERNAL_URL || `http://localhost:${port}`}/process-speech`);
    
    res.type('text/xml');
    res.send(twiml.toString());
  } catch (error) {
    console.error('Error in voice webhook:', error);
    res.status(500).send('Error processing webhook');
  }
});

// Media Stream endpoint for audio streaming
app.post('/stream', (req, res) => {
  console.log('Media stream connected');
  
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  // Send initial connection message
  res.write('data: {"type": "connected"}\n\n');

  // Handle audio data from Twilio
  req.on('data', async (chunk) => {
    try {
      console.log('Received audio chunk:', chunk.length, 'bytes');
      
      if (!audioPipeline) {
        res.write(`data: ${JSON.stringify({
          type: 'error',
          message: 'Audio processing not available - OpenAI not configured'
        })}\n\n`);
        return;
      }
      
      // Process audio chunk through OpenAI
      const transcription = await processAudioChunk(chunk);
      
      if (transcription) {
        console.log('Transcription:', transcription.text);
        
        // Send transcription to Make.com
        await sendToMake(transcription);
        
        // Generate TTS response if needed
        let ttsResponse = null;
        if (transcription.response_needed) {
          ttsResponse = await audioPipeline.generateTTSResponse(transcription.intent, transcription.text);
          console.log('TTS Response:', ttsResponse);
        }
        
        // Send transcription and TTS response back to client
        res.write(`data: ${JSON.stringify({
          type: 'transcription',
          text: transcription.text,
          intent: transcription.intent,
          confidence: transcription.confidence,
          tts_response: ttsResponse
        })}\n\n`);
      }
    } catch (error) {
      console.error('Error processing audio chunk:', error);
    }
  });

  req.on('end', () => {
    console.log('Media stream ended');
    res.end();
  });
});

// Endpoint to handle speech processing
app.post('/process-speech', async (req, res) => {
  try {
    const speechResult = req.body.SpeechResult;
    const confidence = req.body.Confidence;
    const callSid = req.body.CallSid;
    
    console.log('Received speech:', speechResult);
    console.log('Confidence:', confidence);
    console.log('Call SID:', callSid);
    
    if (!speechResult) {
      // No speech detected, ask again
      const twiml = new twilio.twiml.VoiceResponse();
      twiml.say({
        voice: 'alice',
        language: 'en-US',
        rate: '0.9'
      }, 'I didn\'t catch that. Could you please repeat how we can help you today?');
      
      const gather = twiml.gather({
        input: 'speech',
        language: 'en-US',
        speechTimeout: 'auto',
        action: `${process.env.RENDER_EXTERNAL_URL || `http://localhost:${port}`}/process-speech`,
        method: 'POST'
      });
      
      twiml.redirect(`${process.env.RENDER_EXTERNAL_URL || `http://localhost:${port}`}/process-speech`);
      
      res.type('text/xml');
      res.send(twiml.toString());
      return;
    }
    
    // Process the speech with OpenAI
    let response = "I'm sorry, I didn't understand that. Could you please ask about our pricing, service areas, or if you'd like to place an order?";
    
    if (audioPipeline) {
      try {
        // Analyze intent and generate response
        const intent = await audioPipeline.analyzeIntent(speechResult);
        response = await audioPipeline.generateTTSResponse(intent.intent, speechResult);
        
        console.log('Intent:', intent.intent);
        console.log('Response:', response);
      } catch (error) {
        console.error('Error processing speech:', error);
      }
    }
    
    // Create TwiML response
    const twiml = new twilio.twiml.VoiceResponse();
    
    twiml.say({
      voice: 'alice',
      language: 'en-US',
      rate: '0.9'
    }, response);
    
    // Add natural pause
    twiml.pause({ length: 0.5 });
    
    // Ask if they need anything else (more natural)
    twiml.say({
      voice: 'alice',
      language: 'en-US',
      rate: '0.9'
    }, 'What else can I help you with today?');
    
    // Continue listening for more input
    const gather = twiml.gather({
      input: 'speech',
      language: 'en-US',
      speechTimeout: 'auto',
      action: `${process.env.RENDER_EXTERNAL_URL || `http://localhost:${port}`}/process-speech`,
      method: 'POST'
    });
    
    twiml.redirect(`${process.env.RENDER_EXTERNAL_URL || `http://localhost:${port}`}/process-speech`);
    
    res.type('text/xml');
    res.send(twiml.toString());
  } catch (error) {
    console.error('Error in process-speech:', error);
    res.status(500).send('Error processing speech');
  }
});

// Endpoint to handle TTS responses
app.post('/tts-response', async (req, res) => {
  try {
    const { callSid, responseText } = req.body;
    
    if (!callSid || !responseText) {
      return res.status(400).json({ error: 'Missing callSid or responseText' });
    }

    // Create TwiML response with TTS
    const twiml = new twilio.twiml.VoiceResponse();
    
    twiml.say({
      voice: 'alice',
      language: 'en-US'
    }, responseText);
    
    // Add a brief pause
    twiml.pause({ length: 1 });
    
    // Continue listening
    const connect = twiml.connect();
    connect.stream({
      url: `${process.env.RENDER_EXTERNAL_URL || `http://localhost:${port}`}/stream`
    });
    
    res.type('text/xml');
    res.send(twiml.toString());
  } catch (error) {
    console.error('Error in TTS response:', error);
    res.status(500).json({ error: 'Error processing TTS response' });
  }
});

// Process audio chunk with OpenAI
async function processAudioChunk(audioChunk) {
  try {
    if (!openai) {
      throw new Error('OpenAI not configured');
    }
    
    // Convert audio chunk to base64 if needed
    const audioBase64 = audioChunk.toString('base64');
    
    // Send to OpenAI for transcription
    const transcription = await openai.audio.transcriptions.create({
      file: Buffer.from(audioChunk),
      model: "whisper-1",
      response_format: "json"
    });

    // Analyze intent using GPT
    const intentAnalysis = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an intent analyzer. Analyze the user's speech and extract their intent. Return a JSON object with 'intent' (the main intent) and 'confidence' (0-1 score)."
        },
        {
          role: "user",
          content: transcription.text
        }
      ],
      response_format: { type: "json_object" }
    });

    const intent = JSON.parse(intentAnalysis.choices[0].message.content);

    return {
      text: transcription.text,
      intent: intent.intent,
      confidence: intent.confidence,
      response_needed: intent.response_needed
    };
  } catch (error) {
    console.error('Error processing audio with OpenAI:', error);
    return null;
  }
}

// Send data to Make.com webhook
async function sendToMake(data) {
  try {
    if (!process.env.MAKE_WEBHOOK_URL) {
      console.warn('Make.com webhook URL not configured');
      return;
    }

    await axios.post(process.env.MAKE_WEBHOOK_URL, {
      timestamp: new Date().toISOString(),
      transcription: data.text,
      intent: data.intent,
      confidence: data.confidence,
      source: 'twilio-voice-bot'
    });

    console.log('Data sent to Make.com successfully');
  } catch (error) {
    console.error('Error sending data to Make.com:', error);
  }
}

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(port, () => {
  console.log(`Voice Bot server running on port ${port}`);
  console.log(`Health check: http://localhost:${port}/health`);
  console.log(`Webhook URL: http://localhost:${port}/webhook/voice`);
  console.log(`Stream URL: http://localhost:${port}/stream`);
});

module.exports = app; 