# PowerShell script to update .env file with real credentials
Write-Host "🔧 Voice Bot Environment Setup" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green

# Get OpenAI API Key
Write-Host "`n🔑 OpenAI Configuration:" -ForegroundColor Yellow
$openaiKey = Read-Host "Enter your OpenAI API key (starts with 'sk-')"

# Get Twilio credentials
Write-Host "`n📞 Twilio Configuration:" -ForegroundColor Yellow
$twilioSid = Read-Host "Enter your Twilio Account SID (starts with 'AC')"
$twilioToken = Read-Host "Enter your Twilio Auth Token"
$twilioPhone = Read-Host "Enter your Twilio phone number (format: +1234567890)"

# Optional Make.com webhook
Write-Host "`n🔗 Make.com Configuration (Optional):" -ForegroundColor Yellow
$makeWebhook = Read-Host "Enter your Make.com webhook URL (or press Enter to skip)"

# Create new .env content
$envContent = @"
# Twilio Configuration
TWILIO_ACCOUNT_SID=$twilioSid
TWILIO_AUTH_TOKEN=$twilioToken
TWILIO_PHONE_NUMBER=$twilioPhone

# OpenAI Configuration
OPENAI_API_KEY=$openaiKey
OPENAI_MODEL=gpt-4o-mini

# Make.com Configuration
MAKE_WEBHOOK_URL=$makeWebhook

# Server Configuration
PORT=3000
NODE_ENV=development

# Render.com Configuration (for deployment)
RENDER_EXTERNAL_URL=your_render_app_url_here
"@

# Write to .env file
$envContent | Out-File -FilePath ".env" -Encoding UTF8

Write-Host "`n✅ .env file updated successfully!" -ForegroundColor Green
Write-Host "`n🔄 Please restart your server with: npm run dev" -ForegroundColor Cyan 