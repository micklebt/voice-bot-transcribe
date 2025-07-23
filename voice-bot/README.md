# Voice Bot - Twilio to OpenAI Transcription Pipeline

A real-time voice transcription system that streams audio from Twilio to OpenAI for transcription and intent analysis, then sends results to Make.com for further processing.

## 🚀 Features

- **Professional Greeting**: Warm, professional welcome message for E-Z Rolloff
- **Real-time Audio Streaming**: Stream audio directly from Twilio calls
- **OpenAI Integration**: Uses Whisper for transcription and GPT for intent analysis
- **TTS Responses**: Natural, conversational responses using Twilio's TTS
- **Intent Recognition**: Detects pricing inquiries, service area questions, orders, and more
- **Make.com Integration**: Sends processed data to Make.com webhooks
- **Render.com Ready**: Optimized for deployment on Render.com
- **Webhook Support**: RESTful API endpoints for Twilio integration

## 📋 Prerequisites

- Node.js 18+ 
- Twilio Account with Voice capabilities
- OpenAI API Key
- Make.com account (optional)
- Render.com account (for deployment)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd voice-bot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your actual credentials:
   ```env
   # Twilio Configuration
   TWILIO_ACCOUNT_SID=your_twilio_account_sid_here
   TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
   TWILIO_PHONE_NUMBER=your_twilio_phone_number_here

   # OpenAI Configuration
   OPENAI_API_KEY=your_openai_api_key_here
   OPENAI_MODEL=gpt-4o-mini

   # Make.com Configuration
   MAKE_WEBHOOK_URL=your_make_webhook_url_here

   # Server Configuration
   PORT=3000
   NODE_ENV=development

   # Render.com Configuration (for deployment)
   RENDER_EXTERNAL_URL=your_render_app_url_here
   ```

## 🚀 Running the Application

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

The server will start on `http://localhost:3000`

## 📡 API Endpoints

### Health Check
```
GET /health
```
Returns server status and timestamp.

### Twilio Voice Webhook
```
POST /webhook/voice
```
Handles incoming Twilio voice calls and initiates audio streaming.

### Audio Stream
```
GET /stream
```
Server-Sent Events endpoint for real-time audio processing.

### TTS Response
```
POST /tts-response
```
Handles text-to-speech responses for customer interactions.

### Test TTS
```
POST /test-tts
```
Test endpoint for generating TTS responses (for development/testing).

## 🔧 Twilio Configuration

1. **Set up a Twilio phone number** with Voice capabilities
2. **Configure webhook URL** in Twilio Console:
   - Voice webhook: `https://your-domain.com/webhook/voice`
   - HTTP Method: POST

3. **Enable Media Streams** in your Twilio phone number settings

## 🤖 OpenAI Configuration

1. **Get an OpenAI API key** from https://platform.openai.com/
2. **Set the API key** in your `.env` file
3. **Choose your model** (default: gpt-4o-mini)

## 🔗 Make.com Integration

1. **Create a webhook** in Make.com
2. **Set the webhook URL** in your `.env` file
3. **Configure the webhook** to receive JSON data with:
   - `timestamp`: ISO timestamp
   - `transcription`: Transcribed text
   - `intent`: Detected intent
   - `confidence`: Confidence score (0-1)
   - `source`: Source identifier

## 🚀 Deployment on Render.com

1. **Connect your GitHub repository** to Render
2. **Create a new Web Service**
3. **Configure the service**:
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment: Node
4. **Set environment variables** in Render dashboard
5. **Deploy**

## 📁 Project Structure

```
voice-bot/
├── server.js          # Main Express server
├── pipeline.js        # Audio processing pipeline
├── package.json       # Dependencies and scripts
├── .env              # Environment variables (not in git)
├── .gitignore        # Git ignore rules
└── README.md         # This file
```

## 🔍 How It Works

1. **Call Initiation**: User calls your Twilio number
2. **Professional Greeting**: System plays E-Z Rolloff welcome message
3. **Webhook Trigger**: Twilio sends webhook to `/webhook/voice`
4. **Audio Streaming**: Server connects to Twilio Media Stream
5. **Real-time Processing**: Audio chunks are processed through OpenAI
6. **Transcription**: Whisper converts speech to text
7. **Intent Analysis**: GPT analyzes user intent (pricing, service area, order, etc.)
8. **TTS Response**: System generates appropriate response using TTS
9. **Data Forwarding**: Results sent to Make.com webhook
10. **Response**: Processed data and TTS response returned to client

## 🛡️ Security

- Environment variables for sensitive data
- Helmet.js for security headers
- CORS configuration
- Input validation and sanitization
- Error handling and logging

## 📊 Monitoring

- Health check endpoint for monitoring
- Console logging for debugging
- Error tracking and reporting
- Performance metrics

## 🔧 Customization

### Audio Processing
Modify `pipeline.js` to adjust:
- Chunk sizes
- Audio formats
- Processing parameters

### Intent Analysis
Customize the system prompt in `pipeline.js` to:
- Add custom intents
- Modify confidence thresholds
- Change analysis logic

### Make.com Integration
Update the webhook payload in `server.js` to:
- Add custom fields
- Modify data structure
- Include additional metadata

## 🐛 Troubleshooting

### Common Issues

1. **Audio not streaming**
   - Check Twilio Media Stream settings
   - Verify webhook URL is accessible
   - Ensure proper CORS configuration

2. **Transcription errors**
   - Verify OpenAI API key
   - Check audio format compatibility
   - Monitor API rate limits

3. **Make.com not receiving data**
   - Verify webhook URL
   - Check network connectivity
   - Validate JSON payload format

### Debug Mode
Enable debug logging by setting:
```env
NODE_ENV=development
DEBUG=voice-bot:*
```

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For issues and questions:
- Check the troubleshooting section
- Review Twilio and OpenAI documentation
- Open an issue on GitHub

---

**Note**: Remember to never commit your `.env` file to version control as it contains sensitive API keys and credentials. 