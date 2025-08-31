# Product Requirements Document: Blue-Collar Voice Agent Job Screener

## Introduction/Overview

The Blue-Collar Voice Agent Job Screener is a voice-based automated job interview and skills assessment tool designed specifically for blue-collar roles. This system leverages the Vapi AI SDK for real-time voice interaction and Convex for backend state management, scoring, and HR dashboards. The platform conducts adaptive spoken screenings to quickly vet candidates' practical knowledge, helping employers fill industrial and trade positions faster and more reliably while providing candidates with an accessible, fair opportunity to demonstrate their skills verbally without traditional resume barriers.

The system addresses the critical hiring challenge in blue-collar industries where practical skills and safety knowledge are paramount, but traditional screening methods often miss qualified candidates who may lack formal documentation or have difficulty with written assessments.

## Goals

1. **Reduce time-to-hire** for blue-collar positions by 50-70% through automated initial screening
2. **Eliminate resume barriers** by allowing candidates to demonstrate competency through voice-based assessments
3. **Improve hiring accuracy** by focusing on practical skills and safety knowledge relevant to the role
4. **Provide 24/7 accessibility** for candidates to complete screenings at their convenience
5. **Scale screening capacity** to handle 50+ simultaneous sessions without human intervention
6. **Ensure fair assessment** regardless of accent, background, or traditional credentials

## User Stories

### Employer/HR Manager Stories
- As an HR manager, I want to screen multiple candidates simultaneously so that I can fill positions faster
- As a hiring manager, I want to see real-time transcripts and scores during interviews so that I can intervene if needed
- As a recruiter, I want to compare candidates side-by-side with objective scoring so that I can make data-driven hiring decisions
- As an employer, I want to filter out unqualified candidates automatically so that I only spend time on viable prospects

### Candidate Stories
- As a job seeker without formal credentials, I want to demonstrate my practical skills verbally so that I can be fairly considered for positions
- As a blue-collar worker, I want to complete job screenings by phone so that I can apply during breaks or after work hours
- As a candidate with limited computer skills, I want a simple voice-only interface so that technology doesn't become a barrier
- As a non-native English speaker, I want my responses to be evaluated on content rather than pronunciation so that I receive fair consideration

## Functional Requirements

### Core Voice Interaction System
1. The system must support low-latency (<200ms) WebRTC audio streaming via Vapi AI SDK
2. The system must provide configurable AI interviewer voices through Vapi TTS (e.g., Elliot voice)
3. The system must capture and transcribe candidate responses in real-time using Vapi STT with selectable providers (Deepgram, Whisper)
4. The system must be fully accessible via phone calls and web links
5. The system must automatically handle microphone testing and audio quality checks

### Adaptive Question Flow Engine
6. The system must adapt question sequences based on candidate responses using GPT-4o logic
7. The system must cover four assessment categories:
   - Basic Competency (tool identification, safety steps)
   - Experience Validation (past project recall, troubleshooting)
   - Advanced Problem-Solving (scenario-based challenges)
   - Cultural Fit (teamwork, reliability)
8. The system must support all major blue-collar trade categories (construction, electrical, plumbing, welding, manufacturing, maintenance)
9. The system must complete medium-length screenings (15-20 minutes) covering competency and experience validation
10. The system must escalate or flag critical safety issues dynamically through Convex workflows

### Live Transcription and Monitoring
11. The system must stream live transcripts to the HR dashboard via Convex reactive queries
12. The system must highlight uncertain or unclear words from Vapi transcription engine
13. The system must display real-time candidate responses alongside AI interpretation
14. The system must allow HR managers to monitor multiple active sessions simultaneously

### Technical Skills Assessment
15. The system must score responses in near real-time using Convex actions for:
    - Terminology usage (trade-specific vocabulary)
    - Logical sequencing (step-by-step problem solving)
    - Safety awareness (critical precaution mentions)
16. The system must store all scores in Convex database tied to session IDs
17. The system must provide objective scoring visible only to HR personnel
18. The system must generate automatic rejection notifications for candidates not meeting minimum thresholds

### Voice Analysis and Confidence Scoring
19. The system must utilize Vapi audio metadata for confidence analysis
20. The system must evaluate candidates on:
    - Confidence Score (based on hesitation/filler frequency)
    - Fluency Score (clarity and pacing)
21. The system must maintain accent-neutral design focusing on content over pronunciation
22. The system must forward voice analysis data to Convex scoring pipeline

### Session Recording and Data Management
23. The system must record all sessions in WAV/MP3 format via Vapi
24. The system must store comprehensive session metadata in Convex:
    - Complete transcripts
    - Technical, safety, and confidence scores
    - Red flags and concerns
    - Timestamp data
25. The system must allow HR personnel to replay audio and review analysis post-interview

### Real-Time HR Dashboard
26. The system must display active sessions in real-time using Next.js and Convex
27. The system must show live transcripts, scores, and flags with instant updates
28. The system must provide side-by-side candidate comparison functionality
29. The system must support reactive queries for instant UI updates without page refresh
30. The system must allow sorting and filtering of candidate results

### Automated Candidate Management
31. The system must trigger Convex functions automatically when candidates hit score thresholds
32. The system must generate notifications for:
    - Top 5% performers
    - Safety-critical failures
    - System alerts and issues
33. The system must provide sortable candidate comparison tables with comprehensive scoring

### Integration Capabilities
34. The system must support future integration with external APIs (OSHA certifications, ATS systems)
35. The system must maintain standalone operation initially without external dependencies
36. The system must store integration results in Convex for HR access

### Candidate Onboarding
37. The system must send screening invitations via SMS/email with direct links
38. The system must provide automated microphone testing for browser-based access
39. The system must operate 24/7 without video or typing requirements
40. The system must support both web browser and phone call access methods

## Non-Goals (Out of Scope)

1. **Video-based assessment** - This system is voice-only to maintain accessibility
2. **Real-time human intervention** - Automated screening without live human monitoring required
3. **Multi-language support** - English-only for initial release
4. **Advanced ATS integration** - Standalone system initially, integrations in future phases
5. **Candidate score visibility** - Scores remain confidential to HR only
6. **Custom retraining opportunities** - Automatic rejection without remedial options
7. **Advanced compliance features** - Basic data protection only, not SOC2/HIPAA level
8. **Mobile app development** - Web and phone-based access sufficient
9. **Detailed candidate feedback** - Generic messaging for rejected candidates
10. **Machine learning model training** - Using existing Vapi/OpenAI models without custom training

## Technical Considerations

### Architecture Stack
- **Frontend**: Next.js 15 + TypeScript + TailwindCSS
- **Voice Platform**: Vapi AI SDK (STT, TTS, call flow, transcription, assistant orchestration)
- **Backend**: Convex (serverless database, workflows, real-time queries)
- **AI Models**: GPT-4o via Vapi, Deepgram STT/Whisper, Vapi TTS voices

### Performance Requirements
- Support 50+ simultaneous sessions with Vapi scaling infrastructure
- Convex indexes for fast session lookups and candidate comparisons
- Trade-specific vocabulary caching in Convex for improved performance
- <200ms audio latency maintained throughout sessions

### Security Implementation
- TLS encryption for all data transmission
- Audio file encryption for stored recordings
- Convex storage security with optional CDN integration
- Environment variables properly configured (VAPI_ASSISTANT_ID, VAPI_PUBLIC_KEY, VAPI_PRIVATE_KEY)

### Scalability Planning
- Vapi TURN servers handling WebRTC scaling
- Convex serverless architecture supporting elastic scaling
- Efficient database schemas for rapid candidate lookup and comparison

## Design Considerations

### User Interface Requirements
- Clean, intuitive HR dashboard with real-time updates
- Mobile-responsive design for HR managers accessing from various devices
- Clear visual indicators for session status, scores, and alerts
- Accessible design following WCAG guidelines for HR interface

### Voice User Experience
- Natural conversation flow with appropriate pauses and prompts
- Clear instructions for candidates unfamiliar with voice interfaces
- Graceful handling of audio quality issues or connection problems
- Professional, neutral AI interviewer persona suitable for all demographics

## Success Metrics

### Time-to-Hire Reduction (Employer Focus)
- Measure average days from job posting to offer acceptance
- Track reduction in manual screening hours per position
- Monitor increase in qualified candidates reaching final interviews

### Candidate Satisfaction and Completion Rates
- Track percentage of invited candidates who complete screenings
- Measure candidate feedback scores (post-screening survey)
- Monitor dropout rates at different stages of the assessment

### Screening Accuracy vs. Job Performance
- Correlate screening scores with 90-day job performance reviews
- Track false positive/negative rates in hiring decisions
- Measure retention rates of candidates hired through the system

### System Performance and Adoption
- Monitor concurrent session capacity and system uptime
- Track HR user adoption and daily active usage
- Measure audio quality scores and technical issue resolution times

## Open Questions

1. **Trade-Specific Customization**: How deep should industry-specific questioning go for each trade category? Should scoring algorithms be weighted differently per trade?

2. **Audio Quality Standards**: What minimum audio quality thresholds should trigger session restart or human escalation?

3. **Candidate Communication**: What level of detail should be provided to candidates about the assessment process before they begin?

4. **Data Retention**: How long should session recordings and transcripts be stored? What are the legal requirements for data retention in employment screening?

5. **Edge Case Handling**: How should the system handle candidates with speech impediments, strong accents, or temporary voice issues (cold, etc.)?

6. **Scoring Calibration**: What baseline data should be used to calibrate scoring algorithms across different trade categories?

7. **HR Training Requirements**: What training will HR personnel need to effectively use the dashboard and interpret results?

8. **Future Integration Planning**: Which ATS systems should be prioritized for future integration phases?

9. **Quality Assurance**: What processes should be implemented to continuously validate and improve scoring accuracy?

10. **Regulatory Compliance**: Are there specific employment law requirements or industry regulations that need to be considered for automated screening tools?
