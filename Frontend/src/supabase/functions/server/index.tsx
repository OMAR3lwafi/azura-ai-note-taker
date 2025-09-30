import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'npm:@supabase/supabase-js@2';
import * as kv from './kv_store.tsx';

const app = new Hono();

app.use('*', logger(console.log));
app.use('*', cors({
  origin: '*',
  allowedHeaders: ['*'],
  allowedMethods: ['*'],
}));

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

// Generate AI insights from transcript
app.post('/make-server-779cc231/generate-insights', async (c) => {
  try {
    const { transcript, meetingId, language } = await c.req.json();
    
    if (!transcript || !meetingId) {
      return c.json({ error: 'Missing transcript or meeting ID' }, 400);
    }

    // Simulate AI processing (in production, this would call OpenAI/Claude)
    const insights = await generateMockInsights(transcript, language);
    
    // Store insights in KV store
    await kv.set(`insights_${meetingId}`, insights);
    
    return c.json({ insights });
  } catch (error) {
    console.log('Error generating insights:', error);
    return c.json({ error: 'Failed to generate insights' }, 500);
  }
});

// Save meeting notes
app.post('/make-server-779cc231/save-meeting', async (c) => {
  try {
    const meetingData = await c.req.json();
    
    // Generate unique meeting ID
    const meetingId = `meeting_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Save to KV store
    await kv.set(`meeting_${meetingId}`, {
      ...meetingData,
      id: meetingId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    
    return c.json({ success: true, meetingId });
  } catch (error) {
    console.log('Error saving meeting:', error);
    return c.json({ error: 'Failed to save meeting' }, 500);
  }
});

// Get all meetings
app.get('/make-server-779cc231/meetings', async (c) => {
  try {
    const meetings = await kv.getByPrefix('meeting_meeting_');
    return c.json({ meetings: meetings || [] });
  } catch (error) {
    console.log('Error fetching meetings:', error);
    return c.json({ error: 'Failed to fetch meetings' }, 500);
  }
});

// Get specific meeting
app.get('/make-server-779cc231/meetings/:id', async (c) => {
  try {
    const meetingId = c.req.param('id');
    const meeting = await kv.get(`meeting_${meetingId}`);
    
    if (!meeting) {
      return c.json({ error: 'Meeting not found' }, 404);
    }
    
    return c.json({ meeting });
  } catch (error) {
    console.log('Error fetching meeting:', error);
    return c.json({ error: 'Failed to fetch meeting' }, 500);
  }
});

// Delete meeting
app.delete('/make-server-779cc231/meetings/:id', async (c) => {
  try {
    const meetingId = c.req.param('id');
    await kv.del(`meeting_${meetingId}`);
    await kv.del(`insights_${meetingId}`);
    
    return c.json({ success: true });
  } catch (error) {
    console.log('Error deleting meeting:', error);
    return c.json({ error: 'Failed to delete meeting' }, 500);
  }
});

// Export meeting as PDF/text
app.post('/make-server-779cc231/export-meeting', async (c) => {
  try {
    const { meetingId, format } = await c.req.json();
    
    const meeting = await kv.get(`meeting_${meetingId}`);
    if (!meeting) {
      return c.json({ error: 'Meeting not found' }, 404);
    }
    
    let exportData = '';
    
    if (format === 'markdown') {
      exportData = generateMarkdownExport(meeting);
    } else {
      exportData = generateTextExport(meeting);
    }
    
    return c.json({ 
      exportData,
      filename: `${meeting.title || 'Meeting'}_${new Date(meeting.date).toISOString().split('T')[0]}.${format === 'markdown' ? 'md' : 'txt'}`
    });
  } catch (error) {
    console.log('Error exporting meeting:', error);
    return c.json({ error: 'Failed to export meeting' }, 500);
  }
});

// Mock AI insights generation
async function generateMockInsights(transcript: string, language: 'ar' | 'en') {
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const insights = [];
  
  // Extract key phrases and generate insights
  const keyWords = language === 'ar' 
    ? ['قرار', 'مهمة', 'موعد', 'مسؤولية', 'مشروع', 'اتفق', 'يجب']
    : ['decision', 'task', 'deadline', 'responsibility', 'project', 'agreed', 'should'];
  
  const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  for (const sentence of sentences) {
    const lowerSentence = sentence.toLowerCase();
    
    // Check for decisions
    if (keyWords.some(word => lowerSentence.includes(word.toLowerCase()))) {
      if (lowerSentence.includes(language === 'ar' ? 'قرار' : 'decision') || 
          lowerSentence.includes(language === 'ar' ? 'اتفق' : 'agreed')) {
        insights.push({
          type: 'decision',
          content: sentence.trim(),
          timestamp: new Date().toISOString(),
          confidence: 0.8 + Math.random() * 0.2
        });
      }
      
      // Check for tasks
      if (lowerSentence.includes(language === 'ar' ? 'مهمة' : 'task') ||
          lowerSentence.includes(language === 'ar' ? 'يجب' : 'should')) {
        insights.push({
          type: 'action',
          content: sentence.trim(),
          timestamp: new Date().toISOString(),
          confidence: 0.7 + Math.random() * 0.3
        });
      }
    }
  }
  
  // Generate summary
  if (transcript.length > 100) {
    const summaryText = language === 'ar' 
      ? `تم مناقشة ${sentences.length} نقاط رئيسية في هذا الاجتماع، مع التركيز على التخطيط والتنفيذ.`
      : `Discussed ${sentences.length} key points in this meeting, focusing on planning and execution.`;
    
    insights.push({
      type: 'summary',
      content: summaryText,
      timestamp: new Date().toISOString(),
      confidence: 0.9
    });
  }
  
  return insights.slice(0, 5); // Return max 5 insights
}

function generateMarkdownExport(meeting: any): string {
  const date = new Date(meeting.date).toLocaleDateString();
  
  return `# ${meeting.title || 'Meeting Notes'}

**Date:** ${date}
**Duration:** ${meeting.duration} minutes
**Participants:** ${meeting.participants}

## Summary
${meeting.summary || 'No summary available'}

## Transcript
${meeting.transcript || 'No transcript available'}

## Tags
${meeting.tags ? meeting.tags.map((tag: string) => `- ${tag}`).join('\n') : 'No tags'}

---
Generated by Azora AI NoteTaker
`;
}

function generateTextExport(meeting: any): string {
  const date = new Date(meeting.date).toLocaleDateString();
  
  return `${meeting.title || 'Meeting Notes'}

Date: ${date}
Duration: ${meeting.duration} minutes
Participants: ${meeting.participants}

Summary:
${meeting.summary || 'No summary available'}

Transcript:
${meeting.transcript || 'No transcript available'}

Tags: ${meeting.tags ? meeting.tags.join(', ') : 'No tags'}

---
Generated by Azora AI NoteTaker
`;
}

serve(app.fetch);