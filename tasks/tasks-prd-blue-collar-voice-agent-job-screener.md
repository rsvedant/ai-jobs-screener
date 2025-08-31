# Task List: Blue-Collar Voice Agent Job Screener

Based on PRD: `prd-blue-collar-voice-agent-job-screener.md`

## Current State Assessment

**Existing Infrastructure:**
- Next.js 15 + TypeScript + TailwindCSS foundation
- Convex backend with basic query/mutation pattern established
- ConvexProvider setup for real-time data
- Basic app router structure (layout.tsx, page.tsx)

**Missing Dependencies:**
- Vapi AI SDK for voice interaction
- Voice-related UI components and state management
- Environment variables configuration
- HR dashboard components and routing

**Architecture Pattern:**
- Convex serverless backend (queries/mutations/actions)
- Next.js App Router with React Server Components
- Real-time updates via Convex reactive queries

## Relevant Files

- `package.json` - Add Vapi SDK and other required dependencies
- `.env.local` - Environment variables for Vapi keys and Convex URL
- `lib/vapi/client.ts` - ✅ Vapi client wrapper with error handling, session management, and connection testing integration
- `lib/vapi/types.ts` - ✅ Comprehensive TypeScript types for voice interactions, sessions, and analysis
- `lib/vapi/connection-test.ts` - ✅ Comprehensive WebRTC, network, and voice connection testing suite
- `lib/vapi/hooks.ts` - ✅ React hooks for voice state management, transcripts, connection testing, and session control
- `convex/schema.ts` - ✅ Comprehensive database schema with sessions, candidates, assessments, scores, notifications, and auth tables
- `convex/auth.ts` - ✅ Convex Auth configuration with Password provider for email/password authentication  
- `convex/http.ts` - ✅ HTTP router configuration for auth endpoints
- `convex/sessions.ts` - ✅ Comprehensive session management with active sessions, history, filtering, real-time updates, and HR monitoring
- `convex/candidates.ts` - ✅ Comprehensive candidate management with CRUD operations, search, filtering, scoring, flagging, and bulk operations
- `convex/assessments.ts` - ✅ Basic assessment scoring with MVP pass/fail logic, keyword matching, and engagement scoring
- `convex/notifications.ts` - Notification and alert system backend
- `app/page.tsx` - ✅ Root page with redirect to dashboard for MVP
- `app/dashboard/layout.tsx` - ✅ Simplified dashboard layout with navigation sidebar
- `app/dashboard/page.tsx` - ✅ Main HR dashboard with stats overview and recent activity
- `app/dashboard/sessions/page.tsx` - ✅ Live session monitoring with active and recent sessions
- `app/dashboard/candidates/page.tsx` - ✅ Candidate management with search, filtering, and status tracking
- `app/dashboard/components/LiveSession.tsx` - Real-time session monitoring component
- `app/dashboard/components/CandidateCard.tsx` - Individual candidate display component
- `app/dashboard/components/ScoreDisplay.tsx` - Score visualization component
- `app/dashboard/components/SessionTable.tsx` - Sortable session/candidate table
- `app/interview/page.tsx` - Main candidate interview interface
- `app/interview/[sessionId]/page.tsx` - Individual session interview page
- `app/interview/components/VoiceInterface.tsx` - Voice interaction UI component
- `app/interview/components/MicTest.tsx` - Microphone testing component
- `app/interview/components/QuestionFlow.tsx` - Question display and flow management
- `components/ui/Button.tsx` - Reusable button component
- `components/ui/Card.tsx` - Reusable card component
- `components/ui/Badge.tsx` - Status and score badge component
- `components/ui/Progress.tsx` - Progress indicator component
- `components/notifications/NotificationCenter.tsx` - Notification display component
- `components/notifications/AlertBanner.tsx` - Alert banner component
- `lib/scoring/algorithms.ts` - Scoring algorithm implementations
- `lib/scoring/vocabulary.ts` - Trade-specific vocabulary and terminology
- `lib/scoring/confidence.ts` - Confidence analysis logic
- `lib/audio/recording.ts` - Audio recording and playback utilities
- `lib/audio/quality.ts` - Audio quality testing and validation
- `lib/utils/session.ts` - Session state management utilities
- `lib/utils/formatting.ts` - Data formatting and display utilities
- `types/session.ts` - Session-related TypeScript types
- `types/candidate.ts` - Candidate-related TypeScript types
- `types/assessment.ts` - Assessment and scoring TypeScript types

### Notes

- Unit tests should be placed alongside code files (e.g., `VoiceInterface.tsx` and `VoiceInterface.test.tsx`)
- Use `npx jest [optional/path/to/test/file]` to run tests
- Convex functions are automatically deployed when saved
- Environment variables must be configured before running the application

## Tasks

- [ ] 1.0 Vapi Integration & Voice System Setup
  - [x] 1.1 Install Vapi AI SDK and configure package dependencies
  - [x] 1.2 Create environment variables configuration (.env.local with VAPI keys)
  - [x] 1.3 Build Vapi client wrapper with TypeScript types and error handling
  - [x] 1.4 Implement voice connection testing and WebRTC setup validation
  - [x] 1.5 Create React hooks for voice state management (speaking, listening, connected)
  - [x] 1.6 Set up Vapi assistant configuration with GPT-4o and specified TTS voice

- [x] 2.0 Convex Database Schema & Backend Logic
  - [x] 2.1 Define comprehensive database schema (sessions, candidates, assessments, scores)
  - [x] 2.2 Create session management queries (active sessions, session history, filtering)
  - [x] 2.3 Build candidate data mutations (create, update, scoring, flagging)
  - [x] 2.4 Implement basic assessment scoring (MVP - simplified pass/fail logic)
  - [x] 2.5 Set up indexes for performance optimization (already done in schema)
  - [x] 2.6 Create automated threshold triggers and notification actions (basic notifications implemented)

- [x] 3.0 Real-Time HR Dashboard Interface (MVP)
  - [x] 3.1 Build simplified main dashboard layout with navigation and overview stats
  - [x] 3.2 Create basic live session monitoring page with session status
  - [x] 3.3 Implement basic candidate table with search and filtering
  - [ ] 3.4 Build individual candidate detail views with complete session analysis
  - [ ] 3.5 Add score visualization components (charts, progress bars, confidence indicators)
  - [ ] 3.6 Implement side-by-side candidate comparison functionality
  - [ ] 3.7 Create responsive design for mobile HR manager access

- [ ] 4.0 Candidate Interview Interface & Voice Flow
  - [ ] 4.1 Build candidate landing page with clear instructions and accessibility features
  - [ ] 4.2 Create microphone testing component with automated audio quality validation
  - [ ] 4.3 Implement voice interface UI with visual feedback (speaking/listening states)
  - [ ] 4.4 Build question flow management with dynamic progression logic
  - [ ] 4.5 Add phone call integration support for non-browser access
  - [ ] 4.6 Create session completion flow with appropriate candidate messaging
  - [ ] 4.7 Implement graceful error handling for connection issues and audio problems

- [ ] 5.0 Scoring & Assessment Engine
  - [ ] 5.1 Implement core scoring algorithms (terminology, sequencing, safety awareness)
  - [ ] 5.2 Build trade-specific vocabulary databases and matching logic
  - [ ] 5.3 Create confidence analysis system using Vapi audio metadata
  - [ ] 5.4 Set up automated scoring thresholds and pass/fail determination
  - [ ] 5.5 Implement accent-neutral content analysis focusing on substance over pronunciation
  - [ ] 5.6 Create scoring pipeline integration with Convex real-time updates
  - [ ] 5.7 Build scoring calibration system for different trade categories

- [ ] 6.0 Session Management & Recording System
  - [ ] 6.1 Implement session state management (creation, active tracking, completion)
  - [ ] 6.2 Set up audio recording integration with Vapi (WAV/MP3 format)
  - [ ] 6.3 Create audio playback functionality for HR review
  - [ ] 6.4 Build session metadata storage (transcripts, timestamps, analysis data)
  - [ ] 6.5 Implement session archiving and data retention policies
  - [ ] 6.6 Add session replay functionality with synchronized transcript display
  - [ ] 6.7 Create session export capabilities for external HR systems

- [ ] 7.0 Notification & Alert System
  - [ ] 7.1 Build real-time notification center component for HR dashboard
  - [ ] 7.2 Implement automated alerts for top performers and safety failures
  - [ ] 7.3 Create email notification system for critical events
  - [ ] 7.4 Set up SMS notification integration for urgent alerts
  - [ ] 7.5 Build notification preference management for HR users
  - [ ] 7.6 Implement alert acknowledgment and tracking system
  - [ ] 7.7 Create notification history and audit trail functionality

- [ ] 8.0 Environment Configuration & Deployment Setup
  - [ ] 8.1 Configure all required environment variables (Vapi keys, Convex URL, notification settings)
  - [ ] 8.2 Set up development environment documentation and setup scripts
  - [ ] 8.3 Configure production deployment settings and security measures
  - [ ] 8.4 Implement error monitoring and logging systems
  - [ ] 8.5 Set up performance monitoring for voice latency and system load
  - [ ] 8.6 Create backup and disaster recovery procedures for session data
  - [ ] 8.7 Document API integration points for future ATS connectivity
