# 🚀 Voice Bot Setup Guide

## ✅ Current Status
Your voice bot server is running successfully! The server is configured to start even without credentials, but you'll need to add real API keys to use the full functionality.

## 🔧 Next Steps to Get Full Functionality

### 1. Get Twilio Credentials
1. Go to [Twilio Console](https://console.twilio.com/)
2. Sign up for a free account
3. Get your **Account SID** (starts with "AC...")
4. Get your **Auth Token**
5. Purchase a phone number with **Voice** capabilities

### 2. Get OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign up or log in
3. Create a new API key
4. Copy the key (starts with "sk-...")

### 3. Update Your .env File
Replace the placeholder values in your `.env` file:

```env
# Twilio Configuration
TWILIO_ACCOUNT_SID=AC1234567890abcdef1234567890abcdef
TWILIO_AUTH_TOKEN=your_actual_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890

# OpenAI Configuration
OPENAI_API_KEY=sk-your_actual_openai_key_here
OPENAI_MODEL=gpt-4o-mini

# Make.com Configuration (Optional)
MAKE_WEBHOOK_URL=your_make_webhook_url_here

# Server Configuration
PORT=3000
NODE_ENV=development

# Render.com Configuration (for deployment)
RENDER_EXTERNAL_URL=your_render_app_url_here
```

### 4. Test Your Configuration
After updating the `.env` file, restart your server:

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

You should see:
- ✅ No error messages
- ✅ "Voice Bot server running on port 3000"
- ✅ No warning messages about missing credentials

### 5. Test the TTS Functionality
You can test the TTS response generation with:

```bash
curl -X POST http://localhost:3000/test-tts \
  -H "Content-Type: application/json" \
  -d '{
    "intent": "pricing_inquiry",
    "userText": "How much do your dumpsters cost?"
  }'
```

### 6. Deploy to Render.com
1. Push your code to GitHub
2. Connect your repo to Render.com
3. Create a new Web Service
4. Set environment variables in Render dashboard
5. Deploy

### 7. Configure Twilio Webhook
Once deployed, set your Twilio phone number webhook to:
```
https://your-render-app.onrender.com/webhook/voice
```

## 🎯 What You Can Do Now

### With Current Setup:
- ✅ Server runs without errors
- ✅ Health check endpoint works
- ✅ Basic webhook structure is ready

### After Adding Credentials:
- ✅ Professional E-Z Rolloff greeting
- ✅ Real-time audio transcription
- ✅ Intent recognition (pricing, service area, orders)
- ✅ TTS responses
- ✅ Make.com integration

## 🆘 Troubleshooting

### Server Won't Start
- Check that all dependencies are installed: `npm install`
- Make sure you're in the correct directory: `voice-bot/`

### Credentials Not Working
- Verify your Twilio Account SID starts with "AC"
- Verify your OpenAI API key starts with "sk-"
- Check that you've saved the `.env` file

### TTS Not Working
- Ensure OpenAI API key is valid
- Check your OpenAI account has credits
- Verify the model name is correct

## 📞 Support
If you need help with any of these steps, let me know! I can help you:
- Set up Twilio account
- Configure OpenAI API
- Deploy to Render
- Test the functionality 