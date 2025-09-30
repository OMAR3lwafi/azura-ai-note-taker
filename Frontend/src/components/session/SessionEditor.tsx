import { useState, useEffect, useCallback } from 'react';
import { RecordingControls } from './RecordingControls';
import { TranscriptPane } from './TranscriptPane';
import { InsightsPanel } from './InsightsPanel';
import { useSTT } from '../../hooks/useSTT';
import { meetingsApi, aiApi, segmentsApi } from '../../lib/api';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

interface Segment {
  id: number;
  speaker_label: string | null;
  text: string;
  start_ms: number;
  end_ms: number;
  is_final: boolean;
}

interface AISuggestion {
  id: string;
  kind: 'summary' | 'decision' | 'action_item';
  content: any;
  created_at: string;
}

interface Task {
  id: string;
  title: string;
  assignee?: string | null;
  due_date?: string | null;
  status: 'open' | 'done';
}

interface SessionEditorProps {
  meetingId?: string;
  onMeetingCreated?: (meetingId: string) => void;
  onMeetingEnded?: () => void;
}

type RecordingStatus = 'idle' | 'recording' | 'paused' | 'stopped';

export function SessionEditor({ meetingId: initialMeetingId, onMeetingCreated, onMeetingEnded }: SessionEditorProps) {
  const [meetingId, setMeetingId] = useState<string | null>(initialMeetingId || null);
  const [status, setStatus] = useState<RecordingStatus>('idle');
  const [duration, setDuration] = useState(0);
  const [language, setLanguage] = useState<'ar' | 'en'>('ar');
  const [segments, setSegments] = useState<Segment[]>([]);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [batchBuffer, setBatchBuffer] = useState<Segment[]>([]);

  const handleSegment = useCallback((segment: Segment) => {
    setSegments((prev) => {
      // Update or add segment
      const existingIndex = prev.findIndex((s) => s.id === segment.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = segment;
        return updated;
      }
      return [...prev, segment];
    });

    // Add to batch buffer for server sync
    if (segment.is_final) {
      setBatchBuffer((prev) => [...prev, segment]);
    }
  }, []);

  const { connect, disconnect, isConnected, error: sttError } = useSTT({
    onSegment: handleSegment,
    onError: (err) => {
      toast.error('STT Error', { description: err.message });
    },
    language,
  });

  // Timer for duration
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (status === 'recording') {
      interval = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status]);

  // Batch sync segments to backend
  useEffect(() => {
    if (batchBuffer.length >= 5 && meetingId) {
      const syncSegments = async () => {
        const { error } = await segmentsApi.batch(meetingId, batchBuffer);
        if (!error) {
          setBatchBuffer([]);
        }
      };
      syncSegments();
    }
  }, [batchBuffer, meetingId]);

  // Auto-generate summary every 3 minutes
  useEffect(() => {
    if (status === 'recording' && meetingId && duration > 0 && duration % 180 === 0) {
      handleGenerateSummary();
    }
  }, [duration, status, meetingId]);

  const handleStart = async (lang: 'ar' | 'en') => {
    setLoading(true);
    try {
      // Create meeting
      const { data: meeting, error: meetingError } = await meetingsApi.create({
        language: lang,
        title: `Meeting ${new Date().toLocaleString()}`,
      });

      if (meetingError || !meeting) {
        throw new Error('Failed to create meeting');
      }

      setMeetingId(meeting.id);
      setLanguage(lang);
      onMeetingCreated?.(meeting.id);

      // Connect to STT
      await connect();
      setStatus('recording');
      toast.success('Recording started');
    } catch (err) {
      toast.error('Failed to start recording', {
        description: (err as Error).message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePause = () => {
    setStatus('paused');
    toast.info('Recording paused');
  };

  const handleResume = () => {
    setStatus('recording');
    toast.info('Recording resumed');
  };

  const handleStop = async () => {
    setLoading(true);
    try {
      // Disconnect STT
      disconnect();

      // Sync remaining segments
      if (batchBuffer.length > 0 && meetingId) {
        await segmentsApi.batch(meetingId, batchBuffer);
        setBatchBuffer([]);
      }

      // End meeting
      if (meetingId) {
        await meetingsApi.end(meetingId);
      }

      setStatus('stopped');
      toast.success('Recording stopped and saved');
      onMeetingEnded?.();
    } catch (err) {
      toast.error('Failed to stop recording', {
        description: (err as Error).message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSummary = async () => {
    if (!meetingId) return;

    setLoading(true);
    try {
      const { data, error } = await aiApi.summarize(meetingId, 180);
      if (error) throw new Error(error.message);

      if (data) {
        // Add suggestion
        setSuggestions((prev) => [
          ...prev,
          {
            id: data.id || Date.now().toString(),
            kind: 'summary',
            content: data.content,
            created_at: new Date().toISOString(),
          },
        ]);

        // Extract tasks
        if (data.content?.action_items) {
          const newTasks = data.content.action_items.map((item: any) => ({
            id: `task-${Date.now()}-${Math.random()}`,
            title: item.title,
            assignee: item.assignee,
            due_date: item.due_date,
            status: 'open' as const,
          }));
          setTasks((prev) => [...prev, ...newTasks]);
        }

        toast.success('Summary generated');
      }
    } catch (err) {
      toast.error('Failed to generate summary', {
        description: (err as Error).message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? { ...task, status: task.status === 'open' ? 'done' : 'open' }
          : task
      )
    );
  };

  return (
    <div className="h-screen flex flex-col p-4 gap-4">
      <RecordingControls
        status={status}
        duration={duration}
        language={language}
        onStart={handleStart}
        onPause={handlePause}
        onResume={handleResume}
        onStop={handleStop}
      />

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-0">
        <div className="lg:col-span-2">
          <TranscriptPane segments={segments} autoScroll={status === 'recording'} />
        </div>

        <div className="lg:col-span-1">
          <InsightsPanel
            suggestions={suggestions}
            tasks={tasks}
            onRegenerateSummary={handleGenerateSummary}
            onToggleTask={handleToggleTask}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
}
