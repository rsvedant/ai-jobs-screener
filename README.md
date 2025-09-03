# VoiceScreen AI - Blue-Collar Job Screening Platform

![VoiceScreen AI](https://img.shields.io/badge/VoiceScreen-AI-blue?style=for-the-badge) ![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat&logo=next.js) ![Convex](https://img.shields.io/badge/Convex-Backend-orange?style=flat) ![VAPI.ai](https://img.shields.io/badge/VAPI.ai-Voice-green?style=flat)

**AI-powered voice interview screening system specifically designed for blue-collar trades and industrial positions.**

Built for the **VibeCode Hackathon**, VoiceScreen AI transforms hiring by conducting intelligent voice interviews that assess technical skills, safety awareness, and communication abilities in real-time.

## 🚀 Quick Start

```bash
# Clone and install
git clone https://github.com/yourusername/ai-jobs-screener.git
cd ai-jobs-screener
bun install

# Set up environment variables
# Create .env.local with your VAPI.ai and Convex keys (see below for format)

# Start development (runs Convex backend + Next.js with Turbopack)
bun run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the landing page!

## 🎯 Project Overview

### Problem
Traditional blue-collar hiring fails to identify the best candidates due to resume bias, lack of practical skills assessment, and time-consuming manual processes.

### Solution
VoiceScreen AI provides:
- 🎤 **Voice-First Assessment** - Natural conversation-based interviews
- ⚡ **Instant Evaluation** - Real-time AI analysis with immediate scoring
- 🎯 **Trade-Specific Intelligence** - Customized for construction, electrical, plumbing, welding, manufacturing, maintenance
- 📊 **Comprehensive Analytics** - Detailed insights with objective scoring
- 🔒 **Enterprise Security** - Proper data handling and compliance

## ✨ Key Features

### Voice Interface
- Low-latency audio streaming via VAPI.ai
- Multi-provider speech recognition (Deepgram, Whisper)
- Professional AI interviewer with natural conversation flow
- Phone call support for accessibility

### Assessment Engine
- **Technical Competency** - Tool knowledge, problem-solving
- **Safety Awareness** - Protocol knowledge, hazard recognition
- **Experience Validation** - Work history, project examples
- **Communication Skills** - Clarity, professionalism, teamwork

### Real-Time Dashboard
- Live session monitoring with streaming transcripts
- Instant scoring across multiple competency areas
- Candidate comparison tools with sortable metrics
- Automated notifications for top performers and safety failures

## 🏗️ Architecture

### Tech Stack
```
Runtime: Bun (fast JavaScript runtime and package manager)
Frontend: Next.js 15.5.2 + React 19.1.0 + TypeScript 5 + Tailwind CSS 4
Backend: Convex 1.26.2 (serverless functions + real-time database)
Voice AI: VAPI.ai Web SDK 2.1.0 (WebRTC, STT, TTS, GPT-4o)
Build Tool: Turbopack (Next.js fast bundler)
UI Icons: Lucide React 0.469.0
Charts: Recharts 2.12.7
Auth: Convex Auth 0.0.88
```

### System Flow
1. **Candidate** → Joins via web link or phone call
2. **VAPI.ai** → Conducts intelligent voice interview
3. **Convex** → Processes transcripts and generates assessments
4. **Dashboard** → HR monitors sessions and reviews results

### Key Dependencies

#### **Core Runtime & Framework**
- **`bun`** - Fast JavaScript runtime and package manager
- **`next@15.5.2`** - React framework with App Router and Turbopack
- **`react@19.1.0`** & **`react-dom@19.1.0`** - Latest React with concurrent features
- **`typescript@^5`** - Type safety and enhanced development experience

#### **Backend & Database**
- **`convex@^1.26.2`** - Serverless backend with real-time database
- **`@convex-dev/auth@^0.0.88`** - Authentication system for Convex

#### **Voice AI Integration**
- **`@vapi-ai/web@^2.1.0`** - VAPI.ai Web SDK for voice interactions
- **`uuid@^11.0.3`** - Session and call ID generation

#### **UI & Styling**
- **`tailwindcss@^4`** - Utility-first CSS framework (latest version)
- **`@tailwindcss/postcss@^4`** - PostCSS plugin for Tailwind
- **`lucide-react@^0.469.0`** - Beautiful icon library
- **`recharts@^2.12.7`** - Charts for dashboard analytics

#### **Development Tools**
- **`concurrently@^9.2.1`** - Run Convex backend and Next.js frontend simultaneously
- **`eslint@^9`** & **`eslint-config-next@15.5.2`** - Code linting and standards
- **`@types/*`** packages - TypeScript definitions for all dependencies

#### **Build & Performance**
- **Turbopack** (built into Next.js 15) - Ultra-fast bundler for development and builds
- **React 19 concurrent features** - Improved performance and user experience
- **Bun runtime** - Faster package installation and script execution

## 📁 Project Structure

```
ai-jobs-screener/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Landing page
│   ├── interview/         # Voice interview interface
│   │   └── components/VoiceInterface.tsx
│   └── dashboard/         # HR management interface
│       ├── page.tsx       # Dashboard overview
│       ├── candidates/    # Candidate management
│       └── sessions/      # Live session monitoring
├── convex/                # Backend functions
│   ├── schema.ts          # Database schema
│   ├── sessions.ts        # Session management
│   ├── assessments.ts     # Assessment logic
│   ├── candidates.ts      # Candidate management
│   ├── vapiApi.ts         # VAPI.ai integration
│   └── vapiIntegration.ts # Webhook processing
├── lib/vapi/              # VAPI.ai client library
│   ├── client.ts          # Enhanced VAPI wrapper
│   ├── hooks.ts           # React hooks
│   └── types.ts           # TypeScript definitions
└── prompts/               # AI prompts and configs
    └── blue-collar-interviewer-prompt.md
```

## 🔧 Installation & Setup

### Prerequisites
- **Bun runtime** (recommended) or Node.js 18+
- **VAPI.ai account** with API keys
- **Convex account** for backend services

### Package Manager Options

#### **Using Bun (Recommended)**
This project is optimized for Bun, which provides significant benefits:

**Why Bun?**
- ⚡ **3x faster** package installation compared to npm
- 🚀 **Faster script execution** for development and build commands
- 📦 **Built-in bundler** that works well with Next.js Turbopack
- 🔧 **Drop-in replacement** for npm/yarn with better performance
- 💾 **Smaller** `bun.lockb` file vs `package-lock.json`

```bash
# Install Bun
curl -fsSL https://bun.sh/install | bash

# Install dependencies (faster than npm/yarn)
bun install

# Run development server
bun run dev
```

#### **Alternative: Using npm/yarn**
If you prefer npm or yarn, you can still use them:
```bash
# Using npm
npm install
npm run dev

# Using yarn
yarn install
yarn dev

# Note: You'll need to replace 'bunx' with 'npx' in Convex commands
npx convex dev
```

### Environment Variables

Create `.env.local`:
```bash
# VAPI.ai Configuration (Frontend)
NEXT_PUBLIC_VAPI_PUBLIC_KEY=your_vapi_public_key
NEXT_PUBLIC_VAPI_ASSISTANT_ID=your_vapi_assistant_id

# Convex Configuration (auto-generated)
NEXT_PUBLIC_CONVEX_URL=your_convex_url

# NOTE: VAPI_PRIVATE_KEY should NEVER be in .env.local
# It must be set in Convex Dashboard → Settings → Environment Variables
```

### Setup Steps

1. **Install Bun** (if not already installed):
   ```bash
   curl -fsSL https://bun.sh/install | bash
   # or visit https://bun.sh for other installation methods
   ```

2. **Install dependencies**:
   ```bash
   bun install
   ```

3. **Setup Convex**:
   ```bash
   bunx convex dev
   # Follow prompts to create/link Convex project
   ```

4. **Configure VAPI.ai**:
   - Create account at [vapi.ai](https://vapi.ai)
   - Create assistant with GPT-4o model
   - Use prompt from `prompts/blue-collar-interviewer-prompt.md`
   - Get public key, private key, and assistant ID

5. **Set backend environment variables** (CRITICAL SECURITY STEP):
   - Go to Convex Dashboard → Settings → Environment Variables
   - Add `VAPI_PRIVATE_KEY` with your VAPI private key
   - ⚠️ **NEVER** put private keys in `.env.local` or frontend code

6. **Start development**:
   ```bash
   bun run dev
   # This runs: concurrently 'bunx convex dev' 'next dev --turbopack'
   # Starts both Convex backend and Next.js frontend with Turbopack
   ```

### Available Scripts

From `package.json`, the following scripts are available:

```bash
# Development - runs both Convex and Next.js with Turbopack
bun run dev

# Production build with Turbopack (faster builds)
bun run build

# Start production server
bun run start

# Run ESLint for code quality
bun run lint
```

## 📖 Usage Guide

### For HR Managers

#### Dashboard Overview (`/dashboard`)
- Monitor active interview sessions in real-time
- View candidate pipeline and success rates
- Review completed assessments and scores
- Access candidate profiles and transcripts

#### Live Session Monitoring
- Real-time transcripts as candidates speak
- Session quality indicators (audio, connection)
- Automated alerts for top performers or safety concerns
- Ability to review detailed assessments

### For Candidates

#### Interview Process (`/interview`)
1. **Setup**: Enter basic info (name, position, trade category)
2. **Audio Test**: Microphone and connection verification
3. **Interview**: 5-10 minute conversation with AI interviewer
4. **Completion**: Automatic assessment generation

#### Interview Experience
- Natural conversation about experience and skills
- Questions adapt based on responses
- Assessment covers technical skills, safety, experience, communication
- Professional, encouraging AI interviewer

## 🔌 API Reference

### Convex Functions

#### Sessions
```typescript
// Create new session
api.sessions.createSession({ candidateId, sessionId, vapiCallId? })

// Add real-time transcript
api.sessions.addTranscript({ sessionId, transcript })

// Complete session
api.sessions.completeSession({ sessionId, duration, recordingUrl? })
```

#### Assessments
```typescript
// Evaluate session transcripts
api.assessments.evaluateSessionTranscripts({ sessionId })

// Get assessment by session
api.assessments.getAssessmentBySession({ sessionId })

// Get recent assessments
api.assessments.getRecentAssessments({ limit?, passed? })
```

#### Candidates
```typescript
// Create candidate
api.candidates.createCandidate({ email, firstName?, lastName?, position, tradeCategory })

// Get all candidates
api.candidates.getAllCandidates({ tradeCategory?, screeningStatus?, limit? })

// Get candidate analytics
api.candidates.getCandidateAnalytics({})
```

### VAPI.ai Integration

```typescript
// VapiClient usage
const client = new VapiClient({
  publicKey: 'your_public_key',
  assistantId: 'your_assistant_id'
});

await client.initialize();
await client.startSession();
client.on('transcript', handleTranscript);
client.on('connected', handleConnection);
```

## 🔒 Security & Compliance

### Data Protection
- End-to-end encryption for voice streams
- Secure storage of recordings and transcripts
- GDPR compliance with proper consent management
- Role-based access control for HR teams

### Authentication & API Key Security
- **Convex Auth integration** with role-based access control
- **Secure API key management**: Private keys only in backend environment
- **Environment variable separation**: Public keys for frontend, private keys for backend only
- **API key rotation capabilities** for security maintenance
- **Audit logging** for compliance and security monitoring
- **⚠️ Security Rule**: NEVER expose private keys in frontend code or `.env.local`

### Security Checklist

#### ✅ **DO**
- ✅ Use `NEXT_PUBLIC_` prefix for frontend environment variables
- ✅ Store private keys in Convex Dashboard → Environment Variables
- ✅ Use `process.env.VAPI_PRIVATE_KEY` only in Convex actions/mutations
- ✅ Regularly rotate API keys
- ✅ Monitor API usage and costs

#### ❌ **DON'T**
- ❌ Never hardcode API keys in source code
- ❌ Never put private keys in `.env.local` or frontend
- ❌ Never commit `.env.local` to version control
- ❌ Never use `NEXT_PUBLIC_VAPI_PRIVATE_KEY` (this exposes it!)
- ❌ Never make VAPI API calls with private keys from frontend

## 📊 Assessment System

### Scoring Categories (0-100 each)

1. **Technical Skills**
   - Tool knowledge and usage
   - Problem-solving approach
   - Process understanding
   - Industry terminology

2. **Safety Awareness**
   - Protocol knowledge
   - Hazard recognition
   - Emergency response
   - Personal protective equipment

3. **Experience Validation**
   - Relevant work history
   - Project examples
   - Troubleshooting ability
   - Skills progression

4. **Communication**
   - Clarity and organization
   - Professional interaction
   - Teamwork indicators
   - Customer service aptitude

### Trade-Specific Evaluations
- **Construction**: Safety protocols, equipment operation, building codes
- **Electrical**: Circuit knowledge, safety procedures, troubleshooting
- **Plumbing**: System understanding, repair techniques, code compliance
- **Welding**: Technique knowledge, material properties, safety practices
- **Manufacturing**: Quality control, process optimization, safety standards
- **Maintenance**: Diagnostic skills, repair procedures, preventive care

## 🚀 Deployment

### Vercel (Recommended)
```bash
vercel
# Set environment variables in Vercel dashboard
```

### Convex Production
```bash
bunx convex deploy --prod
bunx convex env set VAPI_PRIVATE_KEY your_prod_key --prod
```

### Production Checklist
- [ ] Environment variables configured
- [ ] Convex production deployment active
- [ ] VAPI.ai production assistant configured
- [ ] SSL/HTTPS enabled
- [ ] Error monitoring setup
- [ ] Performance monitoring enabled

## 🧪 Testing

### Development Testing
```bash
# Run linting
bun run lint

# Run type checking
bunx tsc --noEmit

# Build project to check for errors
bun run build

# Test Convex functions (clear and restart)
bunx convex dev --clear

# Verify environment setup
cat .env.local
```

### Manual Testing
- Voice interface connection and audio quality
- Real-time transcript streaming
- Assessment generation accuracy
- Dashboard real-time updates

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Make changes with appropriate tests
4. Commit: `git commit -m 'Add amazing feature'`
5. Push: `git push origin feature/amazing-feature`
6. Create Pull Request

### Code Standards
- TypeScript strict mode
- ESLint compliance
- Component documentation
- Error handling
- Performance considerations

## 📄 License

MIT License - Built for VibeCode Hackathon 2025

## 🎉 Acknowledgments

- **VibeCode Hackathon** for the opportunity to build meaningful solutions
- **VAPI.ai** for cutting-edge voice AI technology
- **Convex** for incredible serverless backend platform
- **Blue-collar workers** who inspired this project
- **HR professionals** who provided insights into hiring challenges

## 📞 Support

### Resources
- 📖 **Documentation**: This README
- 🎯 **Requirements**: `tasks/prd-blue-collar-voice-agent-job-screener.md`
- 🔧 **Convex Docs**: [docs.convex.dev](https://docs.convex.dev)
- 🎤 **VAPI.ai Docs**: [docs.vapi.ai](https://docs.vapi.ai)

### Common Issues

#### Voice Interface Not Working
- Check browser microphone permissions
- Verify VAPI public key is correct
- Ensure HTTPS in production
- Test network connectivity

#### Dashboard Not Loading
- Verify Convex URL is correct
- Check Convex deployment status
- Clear browser cache
- Ensure functions are deployed

#### Assessment Not Generated
- Check transcript storage during interview
- Verify VAPI call ID is stored
- Monitor Convex function logs
- Confirm VAPI private key in backend

### Contact
- 💬 **GitHub Issues**: Bug reports and features
- 📧 **Email**: Development team contact
- 🗨️ **Discord**: VibeCode Hackathon community

---

**Transforming blue-collar hiring through AI.**


