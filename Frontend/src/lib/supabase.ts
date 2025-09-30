import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Type exports for database
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          locale: string;
          auto_delete_days: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      meetings: {
        Row: {
          id: string;
          owner_id: string;
          title: string | null;
          started_at: string;
          ended_at: string | null;
          language: 'ar' | 'en';
          tags: string[];
          project: string | null;
          is_offline: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['meetings']['Row'], 'id' | 'started_at' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['meetings']['Insert']>;
      };
      segments: {
        Row: {
          id: number;
          meeting_id: string;
          speaker_label: string | null;
          start_ms: number;
          end_ms: number;
          text: string;
          lang: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['segments']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['segments']['Insert']>;
      };
      ai_suggestions: {
        Row: {
          id: string;
          meeting_id: string;
          kind: 'summary' | 'decision' | 'action_item';
          content: any;
          source_window: number | null;
          created_at: string;
          model: string | null;
          latency_ms: number | null;
        };
        Insert: Omit<Database['public']['Tables']['ai_suggestions']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['ai_suggestions']['Insert']>;
      };
      tasks: {
        Row: {
          id: string;
          meeting_id: string;
          title: string;
          assignee: string | null;
          due_date: string | null;
          status: 'open' | 'done';
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['tasks']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['tasks']['Insert']>;
      };
    };
  };
};