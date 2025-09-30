import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  CheckCircle2, 
  FileText, 
  RefreshCw, 
  ChevronDown,
  ChevronRight,
  User,
  Calendar,
  Sparkles
} from 'lucide-react';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from './ui/glass-card';
import { Button } from './ui/button';
import { Skeleton } from './ui/loader';
import { Badge } from './ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { t, type Language } from '../lib/i18n';

interface AISuggestion {
  id: string;
  kind: 'summary' | 'decision' | 'action_item';
  content: {
    summary?: string;
    decisions?: string[];
    action_items?: Array<{
      title: string;
      assignee?: string;
      due_date?: string;
    }>;
    is_final?: boolean;
  };
  created_at: string;
  latency_ms?: number;
}

interface Task {
  id: string;
  title: string;
  assignee?: string;
  due_date?: string;
  status: 'open' | 'done';
}

interface InsightsPanelProps {
  meetingId: string | null;
  language: Language;
  isRecording: boolean;
}

export default function InsightsPanel({ meetingId, language, isRecording }: InsightsPanelProps) {
  const { session } = useAuth();
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const [expandedSections, setExpandedSections] = useState({
    summary: true,
    decisions: true,
    tasks: true,
  });

  // Subscribe to real-time AI suggestions
  useEffect(() => {
    if (!meetingId) return;

    // Initial fetch
    fetchSuggestions();
    fetchTasks();

    // Subscribe to realtime updates
    const suggestionsChannel = supabase
      .channel(`suggestions:${meetingId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ai_suggestions',
          filter: `meeting_id=eq.${meetingId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setSuggestions(prev => [...prev, payload.new as AISuggestion]);
            setLastUpdateTime(new Date());
          }
        }
      )
      .subscribe();

    const tasksChannel = supabase
      .channel(`tasks:${meetingId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `meeting_id=eq.${meetingId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setTasks(prev => [...prev, payload.new as Task]);
          } else if (payload.eventType === 'UPDATE') {
            setTasks(prev => prev.map(t => 
              t.id === payload.new.id ? payload.new as Task : t
            ));
          }
        }
      )
      .subscribe();

    return () => {
      suggestionsChannel.unsubscribe();
      tasksChannel.unsubscribe();
    };
  }, [meetingId]);

  // Auto-generate suggestions periodically
  useEffect(() => {
    if (!isRecording || !meetingId) return;

    const interval = setInterval(() => {
      generateSummary();
    }, 180000); // Every 3 minutes

    return () => clearInterval(interval);
  }, [isRecording, meetingId]);

  const fetchSuggestions = async () => {
    if (!meetingId) return;

    setIsLoading(true);
    const { data, error } = await supabase
      .from('ai_suggestions')
      .select('*')
      .eq('meeting_id', meetingId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setSuggestions(data);
    }
    setIsLoading(false);
  };

  const fetchTasks = async () => {
    if (!meetingId) return;

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('meeting_id', meetingId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setTasks(data);
    }
  };

  const generateSummary = async () => {
    if (!meetingId || isGenerating) return;

    setIsGenerating(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/api/v1/ai/summarize`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            meetingId,
            windowSec: 180, // Last 3 minutes
          }),
        }
      );

      if (response.ok) {
        setLastUpdateTime(new Date());
      }
    } catch (err) {
      console.error('Failed to generate summary:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleTaskStatus = async (taskId: string, currentStatus: 'open' | 'done') => {
    const newStatus = currentStatus === 'open' ? 'done' : 'open';
    
    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus })
      .eq('id', taskId);

    if (!error) {
      setTasks(prev => prev.map(t => 
        t.id === taskId ? { ...t, status: newStatus } : t
      ));
    }
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Get latest summary
  const latestSummary = suggestions.find(s => s.kind === 'summary');
  const allDecisions = suggestions
    .filter(s => s.content.decisions)
    .flatMap(s => s.content.decisions || []);

  if (!meetingId) {
    return (
      <GlassCard variant="default" intensity="light" className="h-full">
        <GlassCardContent className="flex items-center justify-center h-full">
          <p className="text-white/50">{t(language, 'session.noContent')}</p>
        </GlassCardContent>
      </GlassCard>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-4 p-4">
      {/* Header */}
      <GlassCard variant="elevated" intensity="medium">
        <GlassCardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              <GlassCardTitle className="text-lg">
                {t(language, 'session.insights')}
              </GlassCardTitle>
            </div>
            <div className="flex items-center gap-2">
              {lastUpdateTime && (
                <Badge variant="secondary" className="text-xs">
                  {new Date(lastUpdateTime).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </Badge>
              )}
              <Button
                onClick={generateSummary}
                disabled={isGenerating || !isRecording}
                variant="ghost"
                size="icon"
                className="glass-surface"
              >
                <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </GlassCardHeader>
      </GlassCard>

      {/* Content */}
      <div className="flex-1 overflow-y-auto space-y-4">
        {/* Summary Section */}
        <Collapsible 
          open={expandedSections.summary}
          onOpenChange={() => toggleSection('summary')}
        >
          <GlassCard variant="default" intensity="light">
            <CollapsibleTrigger className="w-full">
              <GlassCardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    <span className="font-medium">{t(language, 'session.summary')}</span>
                  </div>
                  {expandedSections.summary ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </div>
              </GlassCardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <GlassCardContent>
                {isLoading ? (
                  <Skeleton variant="text" lines={3} />
                ) : latestSummary ? (
                  <div className="space-y-2">
                    <p className="text-white/90 leading-relaxed">
                      {latestSummary.content.summary}
                    </p>
                    {latestSummary.content.is_final && (
                      <Badge variant="outline" className="text-xs">
                        <Sparkles className="w-3 h-3 mr-1" />
                        Final Summary
                      </Badge>
                    )}
                  </div>
                ) : (
                  <p className="text-white/50 italic">
                    {t(language, 'session.noContent')}
                  </p>
                )}
              </GlassCardContent>
            </CollapsibleContent>
          </GlassCard>
        </Collapsible>

        {/* Decisions Section */}
        <Collapsible 
          open={expandedSections.decisions}
          onOpenChange={() => toggleSection('decisions')}
        >
          <GlassCard variant="default" intensity="light">
            <CollapsibleTrigger className="w-full">
              <GlassCardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    <span className="font-medium">{t(language, 'session.decisions')}</span>
                    {allDecisions.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {allDecisions.length}
                      </Badge>
                    )}
                  </div>
                  {expandedSections.decisions ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </div>
              </GlassCardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <GlassCardContent>
                {allDecisions.length > 0 ? (
                  <ul className="space-y-2">
                    {allDecisions.map((decision, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                        <span className="text-white/90 text-sm">{decision}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-white/50 italic text-sm">
                    {t(language, 'session.noContent')}
                  </p>
                )}
              </GlassCardContent>
            </CollapsibleContent>
          </GlassCard>
        </Collapsible>

        {/* Tasks Section */}
        <Collapsible 
          open={expandedSections.tasks}
          onOpenChange={() => toggleSection('tasks')}
        >
          <GlassCard variant="default" intensity="light">
            <CollapsibleTrigger className="w-full">
              <GlassCardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    <span className="font-medium">{t(language, 'session.tasks')}</span>
                    {tasks.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {tasks.filter(t => t.status === 'open').length}/{tasks.length}
                      </Badge>
                    )}
                  </div>
                  {expandedSections.tasks ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </div>
              </GlassCardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <GlassCardContent>
                {tasks.length > 0 ? (
                  <div className="space-y-2">
                    {tasks.map((task) => (
                      <div 
                        key={task.id}
                        className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                        onClick={() => toggleTaskStatus(task.id, task.status)}
                      >
                        <CheckCircle2 
                          className={`w-5 h-5 mt-0.5 flex-shrink-0 transition-colors ${
                            task.status === 'done' 
                              ? 'text-green-400 fill-green-400' 
                              : 'text-white/40'
                          }`}
                        />
                        <div className="flex-1 space-y-1">
                          <p className={`text-sm ${task.status === 'done' ? 'line-through text-white/50' : 'text-white/90'}`}>
                            {task.title}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-white/50">
                            {task.assignee && (
                              <div className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                <span>{task.assignee}</span>
                              </div>
                            )}
                            {task.due_date && (
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <span>{new Date(task.due_date).toLocaleDateString()}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-white/50 italic text-sm">
                    {t(language, 'session.noContent')}
                  </p>
                )}
              </GlassCardContent>
            </CollapsibleContent>
          </GlassCard>
        </Collapsible>
      </div>
    </div>
  );
}