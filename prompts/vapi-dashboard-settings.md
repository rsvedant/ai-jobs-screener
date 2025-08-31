# VAPI Dashboard Configuration Guide

This is a reference for configuring your VAPI assistant in the dashboard to work optimally with the interview system.

## Required Settings in VAPI Dashboard

### Model Configuration
- **Model**: OpenAI GPT-4 (recommended)
- **System Message**: Configure for blue-collar job screening with 5-7 minute structured interviews
- **Tools**: Enable the `endCall` tool so the assistant can end interviews automatically

### End Call Configuration
- **End Call Message**: "Thank you for completing the interview. We'll review your responses and be in touch soon. Have a great day!"
- **End Call Phrases**: Add phrases like:
  - "thank you for your time"
  - "we'll be in touch" 
  - "that concludes our interview"
  - "have a great day"

### Session Settings  
- **Max Duration**: 600 seconds (10 minutes)
- **Silence Timeout**: 30 seconds

### Recording & Transcription
- **Recording Enabled**: Yes
- **Transcript Enabled**: Yes
- **Assistant Name**: "Interviewer"
- **User Name**: "Candidate"

### Analysis (Optional)
- **Success Evaluation**: Enable if you want VAPI's built-in scoring
- **Rubric**: NumericScale

## How It Works

1. **Real-time Transcripts**: Our system now stores transcripts as they happen during the interview
2. **Automatic Assessment**: After 5+ exchanges, the system automatically evaluates the candidate based on stored transcripts
3. **Manual Assessment**: You can also manually trigger assessments for completed sessions with transcripts
4. **Dashboard Viewing**: Transcripts and assessments are now visible in the candidate dashboard

## Notes

- The assistant should naturally conclude interviews after 8-12 exchanges (typically 5-7 minutes)
- Our custom evaluation system analyzes communication, technical knowledge, experience, and engagement
- Assessments are created automatically in the background using stored transcript data
