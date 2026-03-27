// ===========================================
// AI CONTENT GENERATION BACKEND SERVER
// Created by: NIBRAS AHMED
// Email: saba.koof21@gmail.com
// Phone: +251 953 536 342
// Location: Finfinnee, Ethiopia 🇪🇹
// ===========================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const Anthropic = require('@anthropic-ai/sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 3000;

// ===========================================
// INITIALIZE AI PROVIDERS
// ===========================================

let anthropic = null;
let genAI = null;

if (process.env.CLAUDE_API_KEY) {
  try {
    anthropic = new Anthropic({
      apiKey: process.env.CLAUDE_API_KEY,
    });
    console.log('✅ Claude API initialized');
  } catch (error) {
    console.error('❌ Claude initialization failed:', error.message);
  }
}

if (process.env.GEMINI_API_KEY) {
  try {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    console.log('✅ Gemini API initialized');
  } catch (error) {
    console.error('❌ Gemini initialization failed:', error.message);
  }
}

// Check if at least one provider is available
if (!anthropic && !genAI) {
  console.error('⚠️  WARNING: No AI provider configured!');
  console.error('⚠️  Please add CLAUDE_API_KEY or GEMINI_API_KEY to your .env file');
}

// ===========================================
// MIDDLEWARE CONFIGURATION
// ===========================================

// Security headers
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['*'];
    
    if (allowedOrigins.includes('*') || !origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));

// Parse JSON bodies
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  message: {
    success: false,
    error: 'Too many requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ===========================================
// API ROUTES
// ===========================================

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'AI Content Generation Backend',
    creator: {
      name: 'NIBRAS AHMED',
      email: 'saba.koof21@gmail.com',
      phone: '+251 953 536 342',
      location: 'Finfinnee, Ethiopia 🇪🇹'
    },
    status: 'online',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    providers: {
      claude: !!anthropic,
      gemini: !!genAI
    },
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Main content generation endpoint
app.post('/api/generate-content', async (req, res) => {
  const startTime = Date.now();
  
  try {
    // Extract and validate request data
    const {
      topic,
      platform = 'instagram',
      tone = 'professional',
      audienceSize = '80000',
      engagementRate = '3',
      includeMonetization = false,
      includeAffiliate = false,
      includeSponsorPitch = false,
      provider = process.env.DEFAULT_AI_PROVIDER || 'claude'
    } = req.body;

    // Validation
    if (!topic || topic.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Topic is required and cannot be empty'
      });
    }

    if (topic.length > 500) {
      return res.status(400).json({
        success: false,
        error: 'Topic is too long. Maximum 500 characters.'
      });
    }

    // Check if requested provider is available
    if (provider === 'claude' && !anthropic) {
      if (genAI) {
        console.log('⚠️  Claude requested but not available, falling back to Gemini');
      } else {
        return res.status(503).json({
          success: false,
          error: 'No AI provider configured. Please set API keys in .env file.'
        });
      }
    }

    if (provider === 'gemini' && !genAI) {
      if (anthropic) {
        console.log('⚠️  Gemini requested but not available, falling back to Claude');
      } else {
        return res.status(503).json({
          success: false,
          error: 'No AI provider configured. Please set API keys in .env file.'
        });
      }
    }

    // Build the AI prompt
    console.log(`📝 Generating content for topic: "${topic.substring(0, 50)}..."`);
    const prompt = buildComprehensivePrompt({
      topic,
      platform,
      tone,
      audienceSize,
      engagementRate,
      includeMonetization,
      includeAffiliate,
      includeSponsorPitch
    });

    // Generate content with AI
    let aiResponse;
    let usedProvider;

    try {
      if (provider === 'claude' && anthropic) {
        aiResponse = await generateWithClaude(prompt);
        usedProvider = 'claude';
      } else if (genAI) {
        aiResponse = await generateWithGemini(prompt);
        usedProvider = 'gemini';
      } else if (anthropic) {
        aiResponse = await generateWithClaude(prompt);
        usedProvider = 'claude';
      } else {
        throw new Error('No AI provider available');
      }
    } catch (aiError) {
      console.error('❌ AI generation failed:', aiError);
      
      // Try fallback provider
      if (usedProvider === 'claude' && genAI) {
        console.log('🔄 Trying Gemini as fallback...');
        aiResponse = await generateWithGemini(prompt);
        usedProvider = 'gemini';
      } else if (usedProvider === 'gemini' && anthropic) {
        console.log('🔄 Trying Claude as fallback...');
        aiResponse = await generateWithClaude(prompt);
        usedProvider = 'claude';
      } else {
        throw aiError;
      }
    }

    // Parse the AI response
    const parsed = parseAIResponse(aiResponse);

    // Calculate generation time
    const generationTime = Date.now() - startTime;

    // Send successful response
    res.json({
      success: true,
      data: {
        content: parsed.content,
        hashtags: parsed.hashtags,
        monetizationTip: includeMonetization ? parsed.monetizationTip : null,
        affiliateLinks: includeAffiliate ? parsed.affiliateLinks : null,
        sponsorPitch: includeSponsorPitch ? parsed.sponsorPitch : null
      },
      metadata: {
        provider: usedProvider,
        platform,
        tone,
        audienceSize,
        engagementRate,
        generationTimeMs: generationTime,
        timestamp: new Date().toISOString()
      }
    });

    console.log(`✅ Content generated successfully in ${generationTime}ms using ${usedProvider}`);

  } catch (error) {
    console.error('❌ Error in /api/generate-content:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to generate content',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Test endpoint for checking AI providers
app.post('/api/test-ai', async (req, res) => {
  try {
    const results = {
      claude: null,
      gemini: null
    };

    // Test Claude
    if (anthropic) {
      try {
        const testPrompt = 'Say "Hello from Claude" in one sentence.';
        const response = await generateWithClaude(testPrompt);
        results.claude = {
          available: true,
          response: response.substring(0, 100)
        };
      } catch (error) {
        results.claude = {
          available: false,
          error: error.message
        };
      }
    } else {
      results.claude = {
        available: false,
        error: 'API key not configured'
      };
    }

    // Test Gemini
    if (genAI) {
      try {
        const testPrompt = 'Say "Hello from Gemini" in one sentence.';
        const response = await generateWithGemini(testPrompt);
        results.gemini = {
          available: true,
          response: response.substring(0, 100)
        };
      } catch (error) {
        results.gemini = {
          available: false,
          error: error.message
        };
      }
    } else {
      results.gemini = {
        available: false,
        error: 'API key not configured'
      };
    }

    res.json({
      success: true,
      results
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ===========================================
// AI GENERATION FUNCTIONS
// ===========================================

// Generate content using Claude (Anthropic)
async function generateWithClaude(prompt) {
  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2500,
      temperature: 0.8,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    return message.content[0].text;
  } catch (error) {
    console.error('Claude API error:', error);
    throw new Error(`Claude generation failed: ${error.message}`);
  }
}

// Generate content using Gemini (Google)
async function generateWithGemini(prompt) {
  try {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-pro',
      generationConfig: {
        temperature: 0.8,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      }
    });
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini API error:', error);
    throw new Error(`Gemini generation failed: ${error.message}`);
  }
}

// ===========================================
// PROMPT BUILDING
// ===========================================

function buildComprehensivePrompt(params) {
  const {
    topic,
    platform,
    tone,
    audienceSize,
    engagementRate,
    includeMonetization,
    includeAffiliate,
    includeSponsorPitch
  } = params;

  const platformSpecs = {
    instagram: { limit: '2200 characters', style: 'visual, emoji-rich, engaging' },
    tiktok: { limit: '2200 characters', style: 'short, punchy, trend-focused' },
    youtube: { limit: '5000 characters', style: 'detailed, educational, story-driven' },
    twitter: { limit: '280 characters', style: 'concise, impactful, thread-ready' },
    linkedin: { limit: '3000 characters', style: 'professional, value-driven, B2B' },
    facebook: { limit: '2000 characters', style: 'community-focused, conversational' }
  };

  const spec = platformSpecs[platform] || platformSpecs.instagram;

  let prompt = `You are an expert Ethiopian social media content creator specializing in monetizable content for East African creators.

====================
TASK: Create ${platform} Post
====================

TOPIC: "${topic}"

SPECIFICATIONS:
- Platform: ${platform}
- Style: ${spec.style}
- Character Limit: ${spec.limit}
- Tone: ${tone}
- Audience: ${audienceSize}+ followers
- Engagement: ${engagementRate}%
- Region: Ethiopia/East Africa

CONTENT REQUIREMENTS:
1. Hook readers in first 5 words
2. Provide actionable value about "${topic}"
3. Use emojis naturally (include 🇪🇹)
4. Clear call-to-action
5. Ethiopian/East African context
6. Include: "Created by NIBRAS AHMED | 📧 saba.koof21@gmail.com | 📱 +251 953 536 342 | Finfinnee, Ethiopia"

HASHTAGS (10-15 tags):
- Topic-specific hashtags
- Money-making tags: #MakeMoneyOnline #PassiveIncome #SideHustle
- Location tags: #Ethiopia #AddisAbaba #Finfinnee #EastAfrica
- Platform viral tags for ${platform}

${includeMonetization ? `
MONETIZATION STRATEGY:
Create detailed monetization guide for this ${platform} content:
- Specific revenue streams (ads, sponsorships, products)
- Estimated earnings potential
- Step-by-step action plan
- Tools and platforms to use
- Ethiopian market considerations
Include contact: NIBRAS AHMED | saba.koof21@gmail.com | +251 953 536 342
` : ''}

${includeAffiliate ? `
AFFILIATE OPPORTUNITIES:
List 3-5 affiliate programs for "${topic}" suitable for Ethiopia:
- Program name & commission rates
- Why it works in East Africa
- How to join/requirements
- Expected monthly earnings
Include contact: NIBRAS AHMED | saba.koof21@gmail.com | +251 953 536 342
` : ''}

${includeSponsorPitch ? `
SPONSOR PITCH EMAIL:
Write professional brand partnership email:
- Compelling subject line
- Introduction: NIBRAS AHMED
- Stats: ${audienceSize}+ followers, ${engagementRate}% engagement
- Value proposition for brands
- Partnership options
- Contact: saba.koof21@gmail.com | +251 953 536 342 | Finfinnee, Ethiopia
` : ''}

====================
OUTPUT FORMAT:
====================

---CONTENT---
[Your engaging post content here with emojis and CTAs]

---HASHTAGS---
#tag1 #tag2 #tag3 #tag4 #tag5 #tag6 #tag7 #tag8 #tag9 #tag10

${includeMonetization ? '---MONETIZATION---\n[Detailed monetization strategy]\n' : ''}
${includeAffiliate ? '---AFFILIATE---\n[Affiliate opportunities list]\n' : ''}
${includeSponsorPitch ? '---PITCH---\n[Complete sponsor pitch email]\n' : ''}

Make it authentic, actionable, culturally relevant, and focused on helping Ethiopian creators earn money!`;

  return prompt;
}

// ===========================================
// RESPONSE PARSING
// ===========================================

function parseAIResponse(rawResponse) {
  const result = {
    content: '',
    hashtags: [],
    monetizationTip: '',
    affiliateLinks: '',
    sponsorPitch: ''
  };

  try {
    // Extract content section
    const contentMatch = rawResponse.match(/---CONTENT---\s*([\s\S]*?)(?=---[A-Z]+---|$)/);
    if (contentMatch) {
      result.content = contentMatch[1].trim();
    } else {
      // Fallback: use first substantial paragraph
      const paragraphs = rawResponse.split('\n\n').filter(p => p.trim().length > 50);
      result.content = paragraphs[0] || rawResponse.substring(0, 500);
    }

    // Extract hashtags
    const hashtagMatch = rawResponse.match(/---HASHTAGS---\s*([\s\S]*?)(?=---[A-Z]+---|$)/);
    if (hashtagMatch) {
      const hashtagText = hashtagMatch[1].trim();
      result.hashtags = hashtagText.match(/#[\w]+/g) || [];
    } else {
      // Extract any hashtags found in response
      result.hashtags = (rawResponse.match(/#[\w]+/g) || []).slice(0, 15);
    }

    // Ensure we have at least some basic hashtags
    if (result.hashtags.length === 0) {
      result.hashtags = ['#MakeMoneyOnline', '#Ethiopia', '#PassiveIncome', '#SideHustle'];
    }

    // Extract monetization tip
    const monetizationMatch = rawResponse.match(/---MONETIZATION---\s*([\s\S]*?)(?=---[A-Z]+---|$)/);
    if (monetizationMatch) {
      result.monetizationTip = monetizationMatch[1].trim();
    }

    // Extract affiliate links
    const affiliateMatch = rawResponse.match(/---AFFILIATE---\s*([\s\S]*?)(?=---[A-Z]+---|$)/);
    if (affiliateMatch) {
      result.affiliateLinks = affiliateMatch[1].trim();
    }

    // Extract sponsor pitch
    const pitchMatch = rawResponse.match(/---PITCH---\s*([\s\S]*?)(?=---[A-Z]+---|$)/);
    if (pitchMatch) {
      result.sponsorPitch = pitchMatch[1].trim();
    }

  } catch (error) {
    console.error('Error parsing AI response:', error);
    // Return whatever we got as content
    result.content = rawResponse.substring(0, 1000);
  }

  return result;
}

// ===========================================
// ERROR HANDLING
// ===========================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    availableEndpoints: [
      'GET /',
      'GET /health',
      'POST /api/generate-content',
      'POST /api/test-ai'
    ]
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// ===========================================
// SERVER STARTUP
// ===========================================

app.listen(PORT, () => {
  console.log('\n' + '='.repeat(50));
  console.log('🚀 AI CONTENT GENERATION BACKEND SERVER');
  console.log('='.repeat(50));
  console.log(`📡 Server running on: http://localhost:${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`🤖 AI Providers:`);
  console.log(`   - Claude (Anthropic): ${anthropic ? '✅ Ready' : '❌ Not configured'}`);
  console.log(`   - Gemini (Google): ${genAI ? '✅ Ready' : '❌ Not configured'}`);
  console.log(`\n👤 Created by: NIBRAS AHMED`);
  console.log(`📧 Email: saba.koof21@gmail.com`);
  console.log(`📱 Phone: +251 953 536 342`);
  console.log(`📍 Location: Finfinnee, Ethiopia 🇪🇹`);
  console.log('='.repeat(50) + '\n');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('⚠️  SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n⚠️  SIGINT received, shutting down gracefully...');
  process.exit(0);
});

module.exports = app;
