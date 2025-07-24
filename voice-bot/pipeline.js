const OpenAI = require('openai');
const { Transform } = require('stream');

class AudioPipeline {
  constructor(openaiClient) {
    this.openai = openaiClient;
    this.audioBuffer = Buffer.alloc(0);
    this.chunkSize = 1024 * 16; // 16KB chunks
    this.sampleRate = 8000; // Twilio default
    this.channels = 1; // Mono
    this.bitDepth = 16; // 16-bit
  }

  // Process incoming audio stream
  async processStream(audioStream) {
    return new Promise((resolve, reject) => {
      const chunks = [];
      
      audioStream.on('data', (chunk) => {
        chunks.push(chunk);
      });

      audioStream.on('end', async () => {
        try {
          const audioBuffer = Buffer.concat(chunks);
          const result = await this.processAudioBuffer(audioBuffer);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      audioStream.on('error', (error) => {
        reject(error);
      });
    });
  }

  // Process audio buffer in chunks
  async processAudioBuffer(audioBuffer) {
    const chunks = this.splitIntoChunks(audioBuffer);
    const results = [];

    for (const chunk of chunks) {
      try {
        const result = await this.processChunk(chunk);
        if (result) {
          results.push(result);
        }
      } catch (error) {
        console.error('Error processing chunk:', error);
      }
    }

    return this.mergeResults(results);
  }

  // Split audio buffer into manageable chunks
  splitIntoChunks(buffer) {
    const chunks = [];
    let offset = 0;

    while (offset < buffer.length) {
      const chunk = buffer.slice(offset, offset + this.chunkSize);
      chunks.push(chunk);
      offset += this.chunkSize;
    }

    return chunks;
  }

  // Process individual audio chunk
  async processChunk(audioChunk) {
    try {
      // Create a temporary file-like object for OpenAI
      const audioFile = {
        buffer: audioChunk,
        mimetype: 'audio/wav',
        name: 'chunk.wav'
      };

      // Send to OpenAI Whisper for transcription
      const transcription = await this.openai.audio.transcriptions.create({
        file: audioFile,
        model: "whisper-1",
        response_format: "json",
        language: "en"
      });

      if (transcription.text && transcription.text.trim()) {
        // Analyze intent
        const intent = await this.analyzeIntent(transcription.text);
        
        return {
          text: transcription.text,
          intent: intent.intent,
          confidence: intent.confidence,
          response_needed: intent.response_needed,
          timestamp: new Date().toISOString()
        };
      }

      return null;
    } catch (error) {
      console.error('Error processing audio chunk:', error);
      return null;
    }
  }

  // Analyze intent using GPT
  async analyzeIntent(text) {
    try {
      const response = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are an intent analyzer for E-Z Rolloff, a rolloff dumpster service company. 
            Analyze the user's speech and extract their primary intent.
            Common intents include: 
            - pricing_inquiry: Questions about dumpster rental costs, pricing, rates
            - service_area: Questions about service locations, coverage areas, delivery zones
            - place_order: Customer wants to order a dumpster, book service, schedule delivery
            - size_inquiry: Questions about dumpster sizes, capacity, dimensions
            - delivery_timing: Questions about delivery time, scheduling, availability
            - general_question: Other questions about services, policies, etc.
            - greeting: Customer is just saying hello or responding to greeting
            - goodbye: Customer is ending the call
            
            Return a JSON object with 'intent' (string), 'confidence' (number 0-1), and 'response_needed' (boolean indicating if a TTS response is needed).`
          },
          {
            role: "user",
            content: text
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 150
      });

      const result = JSON.parse(response.choices[0].message.content);
      return {
        intent: result.intent || 'unknown',
        confidence: result.confidence || 0.5,
        response_needed: result.response_needed !== false
      };
    } catch (error) {
      console.error('Error analyzing intent:', error);
      return {
        intent: 'unknown',
        confidence: 0.0,
        response_needed: true
      };
    }
  }

  // Merge multiple transcription results
  mergeResults(results) {
    if (results.length === 0) {
      return null;
    }

    if (results.length === 1) {
      return results[0];
    }

    // Combine text from multiple chunks
    const combinedText = results
      .map(r => r.text)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Use the highest confidence intent
    const bestResult = results.reduce((best, current) => 
      current.confidence > best.confidence ? current : best
    );

    return {
      text: combinedText,
      intent: bestResult.intent,
      confidence: bestResult.confidence,
      response_needed: bestResult.response_needed,
      timestamp: new Date().toISOString(),
      chunks: results.length
    };
  }

  // Create a transform stream for real-time processing
  createTransformStream() {
    return new Transform({
      transform: async (chunk, encoding, callback) => {
        try {
          const result = await this.processChunk(chunk);
          if (result) {
            this.push(JSON.stringify(result) + '\n');
          }
          callback();
        } catch (error) {
          callback(error);
        }
      }
    });
  }

  // Validate audio format
  validateAudioFormat(audioBuffer) {
    // Basic validation for WAV format
    if (audioBuffer.length < 44) {
      throw new Error('Audio buffer too small for WAV format');
    }

    const header = audioBuffer.slice(0, 4).toString();
    if (header !== 'RIFF') {
      throw new Error('Invalid WAV header');
    }

    return true;
  }

  // Convert audio format if needed
  convertAudioFormat(audioBuffer, targetFormat = 'wav') {
    // This is a placeholder for audio format conversion
    // In a real implementation, you might use libraries like ffmpeg
    return audioBuffer;
  }

  // Generate TTS response based on intent
  async generateTTSResponse(intent, userText) {
    try {
      const response = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are Sarah, a warm and friendly customer service representative for E-Z Rolloff. 
            You have a natural, conversational speaking style - like talking to a helpful friend.
            
            Speaking style:
            - Use natural contractions (we're, you're, I'd, that's)
            - Speak conversationally, not robotically
            - Use friendly phrases like "Great question!" or "Absolutely!"
            - Keep responses concise but warm (2-3 sentences max)
            - Vary your responses - don't sound repetitive
            
            Company info:
            - Standard rental period: 14 days
            - Sizes: 10 yard, 15 yard, 20 yard dumpsters
            - Competitive pricing with transparent rates
            - Fast delivery and pickup service
            - Serving local areas
            
            Response examples:
            - "Great question! Our 10-yard dumpsters start at around $350, and we offer competitive rates for all sizes. What type of project are you working on?"
            - "Absolutely! We serve most of the local area and can usually deliver within 24 hours. What's your zip code so I can check coverage?"
            - "Perfect! I'd love to help you get set up. What size dumpster do you think you'll need for your project?"
            
            Always be helpful, enthusiastic, and offer to assist further.`
          },
          {
            role: "user",
            content: `Customer intent: ${intent}. Customer said: "${userText}". Generate a natural, conversational response.`
          }
        ],
        max_tokens: 150,
        temperature: 0.8
      });

      return response.choices[0].message.content.trim();
    } catch (error) {
      console.error('Error generating TTS response:', error);
      return "I'd be happy to help you with that! What can I tell you about our dumpster services?";
    }
  }
}

module.exports = AudioPipeline; 