import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './info';

export const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey
);

export interface MeetingNote {
  id: string;
  title: string;
  date: string;
  duration: number;
  participants: number;
  summary: string;
  tags: string[];
  transcript: string;
  language: 'ar' | 'en';
  created_at: string;
  updated_at: string;
}

export interface TranscriptSegment {
  id: string;
  meeting_id: string;
  speaker: string;
  text: string;
  timestamp: string;
  is_final: boolean;
  confidence?: number;
}

export interface AISuggestion {
  id: string;
  meeting_id: string;
  type: 'summary' | 'decision' | 'action' | 'insight';
  content: string;
  timestamp: string;
  confidence?: number;
}