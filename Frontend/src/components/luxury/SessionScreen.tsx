import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Square, Lightbulb, CheckCircle, FileText, Save, Zap, Waves } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Input } from '../ui/input';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

interface SessionScreenProps {
  language: 'ar' | 'en';
  onSessionSaved?: (meetingId: string) => void;
}

interface TranscriptSegment {
  id: string;
  speaker: string;
  text: string;
  timestamp: Date;
  isFinal: boolean;
}

interface AISuggestion {
  type: 'summary' | 'decision' | 'action' | 'insight';
  content: string;
  timestamp: Date;
  confidence?: number;
}

export default function LuxurySessionScreen({ language, onSessionSaved }: SessionScreenProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptSegment[]>([]);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [meetingTitle, setMeetingTitle] = useState('');
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout>();
  const aiTimeoutRef = useRef<NodeJS.Timeout>();

  const isRTL = language === 'ar';

  const text = {
    ar: {
      sessionTitle: 'جلسة مباشرة',
      meetingTitlePlaceholder: 'عنوان الجلسة...',
      startRecording: 'بدء التسجيل',
      stopRecording: 'إيقاف التسجيل',
      resumeRecording: 'استئناف التسجيل',
      saveSession: 'حفظ الجلسة',
      endSession: 'إنهاء الجلسة',
      listening: 'جاري الاستماع...',
      paused: 'متوقف',
      processing: 'معالجة ذكية...',
      aiInsights: 'رؤى الذكاء الاصطناعي',
      summary: 'ملخص',
      decision: 'قرار',
      action: 'إجراء',
      insight: 'رؤية',
      noSuggestions: 'يتم تحليل المحتوى...',
      transcript: 'النص المكتوب',
      speaker: 'المتحدث',
      sessionSaved: 'تم حفظ الجلسة بنجاح',
      savingSession: 'جاري حفظ الجلسة...',
      errorSaving: 'خطأ في حفظ الجلسة',
      readyToRecord: 'جاهز للتسجيل',
      aiPowered: 'مدعوم بالذكاء الاصطناعي'
    },
    en: {
      sessionTitle: 'Live Session',
      meetingTitlePlaceholder: 'Session title...',
      startRecording: 'Start Recording',
      stopRecording: 'Stop Recording',
      resumeRecording: 'Resume Recording',
      saveSession: 'Save Session',
      endSession: 'End Session',
      listening: 'Listening...',
      paused: 'Paused',
      processing: 'AI Processing...',
      aiInsights: 'AI Insights',
      summary: 'Summary',
      decision: 'Decision',
      action: 'Action',
      insight: 'Insight',
      noSuggestions: 'Analyzing content...',
      transcript: 'Live Transcript',
      speaker: 'Speaker',
      sessionSaved: 'Session saved successfully',
      savingSession: 'Saving session...',
      errorSaving: 'Error saving session',
      readyToRecord: 'Ready to record',
      aiPowered: 'AI-Powered'
    }
  };

  const t = text[language];

  // Sample transcript content for simulation
  const sampleContent = {
    ar: [
      'مرحبا بكم في اجتماع اليوم، سنناقش خطة المشروع الجديد',
      'نحتاج إلى تحديد الموعد النهائي للمشروع خلال هذا الأسبوع',
      'اقترح أن نقسم العمل إلى ثلاث مراحل رئيسية',
      'هل يمكن للفريق التقني إعداد التقرير بحلول يوم الجمعة؟',
      'سأتولى مسؤولية التواصل مع العملاء',
      'تم الاتفاق على بدء المرحلة الأولى الأسبوع المقبل',
      'يجب على فريق التصميم تحضير النماذج الأولية',
      'قررنا عقد اجتماع أسبوعي كل يوم اثنين'
    ],
    en: [
      'Welcome to today\'s meeting, we\'ll discuss the new project plan',
      'We need to set the project deadline within this week',
      'I suggest we divide the work into three main phases',
      'Can the technical team prepare the report by Friday?',
      'I\'ll take responsibility for client communication',
      'We agreed to start the first phase next week',
      'The design team should prepare initial mockups',
      'We decided to hold weekly meetings every Monday'
    ]
  };

  // Simulate live transcription
  useEffect(() => {
    if (!isRecording) return;

    const interval = setInterval(() => {
      const content = sampleContent[language];
      const randomIndex = Math.floor(Math.random() * content.length);
      const newSegment: TranscriptSegment = {
        id: Date.now().toString(),
        speaker: Math.random() > 0.5 ? `${t.speaker} 1` : `${t.speaker} 2`,
        text: content[randomIndex],
        timestamp: new Date(),
        isFinal: Math.random() > 0.3
      };

      setTranscript(prev => [...prev, newSegment]);
    }, 3000 + Math.random() * 2000);

    return () => clearInterval(interval);
  }, [isRecording, language, t.speaker]);

  // Generate AI insights periodically
  useEffect(() => {
    if (!isRecording || transcript.length === 0) return;

    if (aiTimeoutRef.current) {
      clearTimeout(aiTimeoutRef.current);
    }

    aiTimeoutRef.current = setTimeout(async () => {
      if (transcript.length >= 3) {
        await generateAIInsights();
      }
    }, 10000);

    return () => {
      if (aiTimeoutRef.current) {
        clearTimeout(aiTimeoutRef.current);
      }
    };
  }, [transcript]);

  // Session timer
  useEffect(() => {
    if (isRecording) {
      intervalRef.current = setInterval(() => {
        setSessionDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRecording]);

  // Auto-scroll transcript
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript]);

  const generateAIInsights = async () => {
    if (isProcessingAI) return;
    
    setIsProcessingAI(true);
    
    try {
      const transcriptText = transcript.map(t => `${t.speaker}: ${t.text}`).join('\n');
      
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-779cc231/generate-insights`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({
          transcript: transcriptText,
          meetingId: `temp_${Date.now()}`,
          language
        })
      });

      if (response.ok) {
        const { insights } = await response.json();
        const newSuggestions = insights.map((insight: any) => ({
          ...insight,
          timestamp: new Date(insight.timestamp)
        }));
        
        setSuggestions(prev => [...prev, ...newSuggestions]);
      }
    } catch (error) {
      console.error('Error generating AI insights:', error);
    } finally {
      setIsProcessingAI(false);
    }
  };

  const saveSession = async () => {
    if (transcript.length === 0) {
      toast.error(language === 'ar' ? 'لا يوجد محتوى للحفظ' : 'No content to save');
      return;
    }

    setIsSaving(true);
    toast.loading(t.savingSession);

    try {
      const meetingData = {
        title: meetingTitle || (language === 'ar' ? 'جلسة بدون عنوان' : 'Untitled Session'),
        date: new Date().toISOString(),
        duration: sessionDuration,
        participants: 2,
        summary: suggestions.find(s => s.type === 'summary')?.content || '',
        tags: [],
        transcript: transcript.map(t => `${t.speaker}: ${t.text}`).join('\n'),
        language,
        suggestions: suggestions.map(s => ({
          type: s.type,
          content: s.content,
          confidence: s.confidence
        }))
      };

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-779cc231/save-meeting`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify(meetingData)
      });

      if (response.ok) {
        const { meetingId } = await response.json();
        toast.success(t.sessionSaved);
        
        setTranscript([]);
        setSuggestions([]);
        setSessionDuration(0);
        setMeetingTitle('');
        setIsRecording(false);
        
        if (onSessionSaved) {
          onSessionSaved(meetingId);
        }
      } else {
        throw new Error('Failed to save session');
      }
    } catch (error) {
      console.error('Error saving session:', error);
      toast.error(t.errorSaving);
    } finally {
      setIsSaving(false);
      toast.dismiss();
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getSuggestionIcon = (type: AISuggestion['type']) => {
    switch (type) {
      case 'summary': return FileText;
      case 'decision': return CheckCircle;
      case 'action': return CheckCircle;
      case 'insight': return Lightbulb;
    }
  };

  const getSuggestionColor = (type: AISuggestion['type']) => {
    switch (type) {
      case 'summary': return { bg: 'from-blue-500/20 to-blue-600/10', border: 'border-blue-400/30', text: 'text-blue-300' };
      case 'decision': return { bg: 'from-green-500/20 to-green-600/10', border: 'border-green-400/30', text: 'text-green-300' };
      case 'action': return { bg: 'from-orange-500/20 to-orange-600/10', border: 'border-orange-400/30', text: 'text-orange-300' };
      case 'insight': return { bg: 'from-purple-500/20 to-purple-600/10', border: 'border-purple-400/30', text: 'text-purple-300' };
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Session Header */}
      <div className="p-4 glass-surface border-b border-glass-border relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
        
        <div className="space-y-4 relative z-10">
          <Input
            type="text"
            placeholder={t.meetingTitlePlaceholder}
            value={meetingTitle}
            onChange={(e) => setMeetingTitle(e.target.value)}
            className="text-center font-light text-lg bg-glass-background border-glass-border text-silver-light placeholder:text-silver-dark"
          />
          
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-400 animate-pulse' : 'bg-silver-dark'}`}></div>
                <span className="text-sm text-silver-light">
                  {isRecording ? t.listening : t.paused}
                </span>
              </div>
              <p className="text-xs text-silver-dark">
                {formatDuration(sessionDuration)} • {t.aiPowered}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              {isProcessingAI && (
                <Badge className="bg-primary/20 text-primary border-primary/30 text-xs animate-pulse">
                  <Zap className="h-3 w-3 mr-1" />
                  {t.processing}
                </Badge>
              )}
              <Badge className={`text-xs ${isRecording ? 'bg-red-500/20 text-red-300 border-red-400/30' : 'bg-glass-background text-silver-medium border-glass-border'}`}>
                {isRecording ? t.listening : t.paused}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Transcript Area */}
        <div className="flex-1 p-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-silver-dark/30 to-transparent"></div>
            <h3 className="text-silver-medium text-sm font-medium tracking-wider uppercase">
              {t.transcript}
            </h3>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-silver-dark/30 to-transparent"></div>
          </div>
          
          <ScrollArea className="h-64 glass-surface rounded-xl border border-glass-border">
            <div ref={scrollRef} className="p-4 space-y-4">
              {transcript.length === 0 ? (
                <div className="text-center text-silver-dark py-12 space-y-4">
                  <div className="w-16 h-16 mx-auto glass-surface rounded-full flex items-center justify-center">
                    <Waves className="h-8 w-8 text-silver-dark" />
                  </div>
                  <div>
                    <p className="font-medium">{isRecording ? t.listening : t.readyToRecord}</p>
                    <p className="text-xs mt-1">{t.aiPowered}</p>
                  </div>
                </div>
              ) : (
                transcript.map((segment) => (
                  <div key={segment.id} className="space-y-2 glass-surface p-3 rounded-lg border border-glass-border">
                    <div className="flex items-center gap-2 text-xs text-silver-dark">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span className="font-medium">{segment.speaker}</span>
                      <span>•</span>
                      <span>{segment.timestamp.toLocaleTimeString()}</span>
                    </div>
                    <p className={`${segment.isFinal ? 'text-silver-light' : 'text-silver-dark italic'} leading-relaxed`}>
                      {segment.text}
                    </p>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* AI Suggestions */}
        <div className="p-4 glass-surface border-t border-glass-border">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-silver-dark/30 to-transparent"></div>
              <h3 className="text-silver-medium text-sm font-medium tracking-wider uppercase flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                {t.aiInsights}
              </h3>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-silver-dark/30 to-transparent"></div>
            </div>
            
            <ScrollArea className="h-32">
              <div className="space-y-2">
                {suggestions.length === 0 ? (
                  <div className="text-center text-silver-dark py-6">
                    <div className="flex items-center justify-center gap-2">
                      <Zap className="h-4 w-4 animate-pulse" />
                      <p className="text-sm">{t.noSuggestions}</p>
                    </div>
                  </div>
                ) : (
                  suggestions.slice(-3).map((suggestion, index) => {
                    const Icon = getSuggestionIcon(suggestion.type);
                    const colors = getSuggestionColor(suggestion.type);
                    return (
                      <div key={index} className={`p-3 rounded-lg bg-gradient-to-r ${colors.bg} border ${colors.border} backdrop-blur-sm`}>
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-glass-background flex items-center justify-center">
                            <Icon className={`h-4 w-4 ${colors.text}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${colors.text} capitalize`}>
                              {t[suggestion.type]}
                            </p>
                            <p className="text-xs text-silver-light mt-1 leading-relaxed">
                              {suggestion.content}
                            </p>
                            {suggestion.confidence && (
                              <div className="flex items-center gap-1 mt-2">
                                <div className="w-12 h-1 bg-glass-background rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full bg-gradient-to-r ${colors.bg} rounded-full`}
                                    style={{ width: `${suggestion.confidence * 100}%` }}
                                  ></div>
                                </div>
                                <p className="text-xs text-silver-dark">
                                  {Math.round(suggestion.confidence * 100)}%
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="p-4 glass-surface border-t border-glass-border">
        <div className="flex items-center justify-center gap-3">
          <Button
            onClick={() => setIsRecording(!isRecording)}
            className={`flex-1 h-12 relative overflow-hidden group elegant-transition ${
              isRecording 
                ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700' 
                : 'bg-gradient-to-r from-primary via-primary to-primary/80 hover:from-primary/90 hover:via-primary hover:to-primary'
            } crystal-glow`}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-crystal-shimmer"></div>
            {isRecording ? (
              <>
                <Square className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'} relative z-10`} />
                <span className="relative z-10">{t.stopRecording}</span>
              </>
            ) : (
              <>
                <Mic className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'} relative z-10`} />
                <span className="relative z-10">
                  {transcript.length > 0 ? t.resumeRecording : t.startRecording}
                </span>
              </>
            )}
          </Button>
          
          {transcript.length > 0 && (
            <Button
              onClick={saveSession}
              disabled={isSaving}
              className="h-12 px-6 bg-glass-background border border-glass-border hover:bg-primary/10 elegant-transition text-silver-light hover:text-primary"
            >
              <Save className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t.saveSession}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}