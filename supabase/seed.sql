-- Seed data for development
-- This file populates the database with sample data for testing

-- Create test users (only works in local development)
-- Note: In production, users are created through Supabase Auth

-- Insert sample profiles (requires existing auth.users)
-- You'll need to create users via Supabase Dashboard or Auth API first

-- Sample meetings data (replace user_id with actual test user ID)
DO $$
DECLARE
  test_user_id uuid;
  meeting_id1 uuid;
  meeting_id2 uuid;
  meeting_id3 uuid;
BEGIN
  -- Get the first user ID (if exists)
  SELECT id INTO test_user_id FROM auth.users LIMIT 1;
  
  IF test_user_id IS NOT NULL THEN
    -- Create sample profile if not exists
    INSERT INTO public.profiles (id, display_name, locale, auto_delete_days)
    VALUES (test_user_id, 'Test User', 'ar', 30)
    ON CONFLICT (id) DO NOTHING;
    
    -- Create sample meetings
    INSERT INTO public.meetings (id, owner_id, title, language, tags, project, is_offline)
    VALUES 
      (gen_random_uuid(), test_user_id, 'Sprint Planning Meeting', 'en', ARRAY['sprint', 'planning'], 'Project Alpha', false),
      (gen_random_uuid(), test_user_id, 'اجتماع مراجعة المشروع', 'ar', ARRAY['review', 'project'], 'Project Beta', false),
      (gen_random_uuid(), test_user_id, 'Team Standup', 'en', ARRAY['daily', 'standup'], 'Project Alpha', false)
    RETURNING id INTO meeting_id1;
    
    -- Get other meeting IDs
    SELECT id INTO meeting_id2 FROM public.meetings WHERE owner_id = test_user_id AND title = 'اجتماع مراجعة المشروع';
    SELECT id INTO meeting_id3 FROM public.meetings WHERE owner_id = test_user_id AND title = 'Team Standup';
    
    -- Add sample segments for first meeting
    IF meeting_id1 IS NOT NULL THEN
      INSERT INTO public.segments (meeting_id, speaker_label, start_ms, end_ms, text, lang)
      VALUES 
        (meeting_id1, 'SPEAKER_1', 0, 5000, 'Good morning everyone, let''s start our sprint planning meeting.', 'en'),
        (meeting_id1, 'SPEAKER_1', 5000, 10000, 'We have several user stories to discuss today.', 'en'),
        (meeting_id1, 'SPEAKER_2', 10000, 15000, 'I think we should prioritize the authentication feature first.', 'en'),
        (meeting_id1, 'SPEAKER_1', 15000, 20000, 'That makes sense. Let''s estimate the effort required.', 'en'),
        (meeting_id1, 'SPEAKER_3', 20000, 25000, 'I estimate it will take about 3 days to implement the backend.', 'en'),
        (meeting_id1, 'SPEAKER_2', 25000, 30000, 'And probably 2 days for the frontend components.', 'en');
      
      -- Add sample AI suggestions
      INSERT INTO public.ai_suggestions (meeting_id, kind, content, source_window, model)
      VALUES 
        (meeting_id1, 'summary', 
         '{"summary": "The team discussed sprint planning with focus on authentication feature. Backend estimated at 3 days, frontend at 2 days.", 
           "decisions": ["Authentication feature will be prioritized first"], 
           "action_items": [
             {"title": "Implement authentication backend", "assignee": "Speaker 3", "due_date": null},
             {"title": "Build frontend authentication components", "assignee": "Speaker 2", "due_date": null}
           ]}'::jsonb,
         180, 'openai/gpt-3.5-turbo');
      
      -- Add sample tasks
      INSERT INTO public.tasks (meeting_id, title, assignee, status)
      VALUES 
        (meeting_id1, 'Implement authentication backend', 'Speaker 3', 'open'),
        (meeting_id1, 'Build frontend authentication components', 'Speaker 2', 'open');
    END IF;
    
    -- Add Arabic meeting segments
    IF meeting_id2 IS NOT NULL THEN
      INSERT INTO public.segments (meeting_id, speaker_label, start_ms, end_ms, text, lang)
      VALUES 
        (meeting_id2, 'SPEAKER_1', 0, 5000, 'أهلاً بالجميع، دعونا نبدأ مراجعة المشروع', 'ar'),
        (meeting_id2, 'SPEAKER_1', 5000, 10000, 'لقد أنجزنا معظم المهام المخطط لها', 'ar'),
        (meeting_id2, 'SPEAKER_2', 10000, 15000, 'نعم، ولكن هناك بعض التحديات في قاعدة البيانات', 'ar'),
        (meeting_id2, 'SPEAKER_1', 15000, 20000, 'سنحتاج إلى مزيد من الوقت لحل هذه المشاكل', 'ar');
      
      INSERT INTO public.ai_suggestions (meeting_id, kind, content, source_window, model)
      VALUES 
        (meeting_id2, 'summary', 
         '{"summary": "تمت مراجعة تقدم المشروع. معظم المهام مكتملة مع وجود تحديات في قاعدة البيانات تحتاج وقت إضافي.", 
           "decisions": ["تخصيص وقت إضافي لحل مشاكل قاعدة البيانات"], 
           "action_items": [
             {"title": "حل مشاكل قاعدة البيانات", "assignee": null, "due_date": null}
           ]}'::jsonb,
         180, 'openai/gpt-3.5-turbo');
    END IF;
    
    RAISE NOTICE 'Seed data created successfully for user %', test_user_id;
  ELSE
    RAISE NOTICE 'No users found. Please create a user first via Supabase Dashboard.';
  END IF;
END $$;