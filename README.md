# 🇪🇹 Ethiopian AI Content Generation Backend

Professional AI-powered backend server for social media money-making content generation.

**Created by: NIBRAS AHMED**  
📧 saba.koof21@gmail.com  
📱 +251 953 536 342  
📍 Finfinnee, Ethiopia

---

## 🚀 QUICK START (5 Minutes!)

### Step 1: Install Node.js
Download from: https://nodejs.org/ (v18 or higher)

### Step 2: Open Terminal/Command Prompt
```bash
cd ai-backend-server
Step 3: Install Dependencies
npm install
Step 4: Get API Key (Choose ONE)
Option A - Claude API (Recommended):
Go to: https://console.anthropic.com/
Sign up / Log in
Click "Get API Key"
Copy your key (starts with sk-ant-...)
Open .env file
Paste: CLAUDE_API_KEY=sk-ant-your-key-here
Option B - Gemini API (Free Tier):
Go to: https://makersuite.google.com/app/apikey
Click "Create API Key"
Copy your key
Open .env file
Paste: GEMINI_API_KEY=your-key-here
Step 5: Run Server
npm start
✅ Server running at: http://localhost:3000
📡 API ENDPOINTS
Health Check
GET http://localhost:3000/health
Generate Content
POST http://localhost:3000/api/generate-content
Content-Type: application/json

{
  "topic": "Ethiopian coffee business",
  "platform": "instagram",
  "tone": "professional",
  "audienceSize": "80000",
  "engagementRate": "3",
  "includeMonetization": true,
  "includeAffiliate": false,
  "includeSponsorPitch": false,
  "provider": "claude"
}
🌐 DEPLOY TO PRODUCTION (FREE)
Option 1: Vercel (Easiest)
npm install -g vercel
vercel
Then add your API key in Vercel dashboard → Settings → Environment Variables
Option 2: Railway.app
Go to https://railway.app/
Click "New Project" → "Deploy from GitHub"
Connect your repo
Add environment variables
Deploy!
Option 3: Render.com
Go to https://render.com/
New → Web Service
Connect GitHub
Add environment variables:
CLAUDE_API_KEY or GEMINI_API_KEY
Deploy!
💰 COST ESTIMATES
Claude API:
Cost: ~$0.01-$0.05 per generation
1000 posts = $10-50
Best quality results
Gemini API:
FREE tier: 60 requests/minute
Paid: ~$0.001 per generation
1000 posts = ~$1
Good for high volume
🔧 TESTING
Test if AI is working:
curl -X POST http://localhost:3000/api/test-ai
📞 SUPPORT
Creator: NIBRAS AHMED
Email: saba.koof21@gmail.com
Phone: +251 953 536 342
Location: Finfinnee, Ethiopia 🇪🇹
Need help? Email me or call!
📝 LICENSE
MIT License - Free to use and modify
Copyright (c) 2024 NIBRAS AHMED

---

## ✅ **SETUP INSTRUCTIONS**

### **1. Create folder and files:**
```bash
mkdir ai-backend-server
cd ai-backend-server
2. Copy all 5 files above into the folder
3. Open terminal and run:
npm install
4. Get API Key (pick one):
Claude: https://console.anthropic.com/
Gemini: https://makersuite.google.com/app/apikey
5. Edit .env file and add your key
6. Start server:
npm start
7. Test it works:
Open browser: http://localhost:3000/health
✅ DONE! Your backend is ready!
Now I'll update your Canva Code to connect to this server. Would you like me to do that now? 🚀
