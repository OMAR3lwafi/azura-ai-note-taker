import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Square, Lightbulb, CheckCircle, FileText, Save } from 'lucide-react';
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

export default function EnhancedSessionScreen({ language, onSessionSaved }: SessionScreenProps) {
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
      meetingTitlePlaceholder: 'عنوان الاجتماع...',
      startRecording: 'بدء التسجيل',
      stopRecording: 'إيقاف التسجيل',
      resumeRecording: 'استئناف التسجيل',
      saveSession: 'حفظ الجلسة',
      endSession: 'إنهاء الجلسة',
      listening: 'جاري الاستماع...',
      paused: 'متوقف',
      processing: 'جاري المعالجة...',
      aiInsights: 'رؤى الذكاء الاصطناعي',
      summary: 'ملخص',
      decision: 'قرار',
      action: 'إجراء',
      insight: 'رؤية',
      noSuggestions: 'لا توجد اقتراحات بعد...',
      transcript: 'النص المكتوب',
      speaker: 'المتحدث',
      sessionSaved: 'تم حفظ الجلسة بنجاح',
      savingSession: 'جاري حفظ الجلسة...',
      errorSaving: 'خطأ في حفظ الجلسة'
    },
    en: {
      sessionTitle: 'Live Session',
      meetingTitlePlaceholder: 'Meeting title...',
      startRecording: 'Start Recording',
      stopRecording: 'Stop Recording',
      resumeRecording: 'Resume Recording',
      saveSession: 'Save Session',
      endSession: 'End Session',
      listening: 'Listening...',
      paused: 'Paused',
      processing: 'Processing...',
      aiInsights: 'AI Insights',
      summary: 'Summary',
      decision: 'Decision',
      action: 'Action',
      insight: 'Insight',
      noSuggestions: 'No suggestions yet...',
      transcript: 'Transcript',
      speaker: 'Speaker',
      sessionSaved: 'Session saved successfully',
      savingSession: 'Saving session...',
      errorSaving: 'Error saving session'
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

    // Clear existing timeout
    if (aiTimeoutRef.current) {
      clearTimeout(aiTimeoutRef.current);
    }

    // Generate insights after 10 seconds of new transcript data
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
        title: meetingTitle || (language === 'ar' ? 'اجتماع بدون عنوان' : 'Untitled Meeting'),
        date: new Date().toISOString(),
        duration: sessionDuration,
        participants: 2, // Simulated
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
        
        // Reset session
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
      case 'summary': return 'bg-blue-500/10 text-blue-600 border-blue-200';
      case 'decision': return 'bg-green-500/10 text-green-600 border-green-200';
      case 'action': return 'bg-orange-500/10 text-orange-600 border-orange-200';
      case 'insight': return 'bg-purple-500/10 text-purple-600 border-purple-200';
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Session Header */}
      <div className="p-4 border-b border-border space-y-3">
        <Input
          type="text"
          placeholder={t.meetingTitlePlaceholder}
          value={meetingTitle}
          onChange={(e) => setMeetingTitle(e.target.value)}
          className="text-center font-medium"
        />
        
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              {isRecording ? t.listening : t.paused} • {formatDuration(sessionDuration)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isRecording && (
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            )}
            {isProcessingAI && (
              <Badge variant="secondary" className="text-xs">
                {t.processing}
              </Badge>
            )}
            <Badge variant={isRecording ? "destructive" : "secondary"}>
              {isRecording ? t.listening : t.paused}
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Transcript Area */}
        <div className="flex-1 p-4">
          <h3 className="font-medium mb-3">{t.transcript}</h3>
          <ScrollArea className="h-64 border rounded-lg">
            <div ref={scrollRef} className="p-3 space-y-3">
              {transcript.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <Mic className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>{isRecording ? t.listening : (language === 'ar' ? 'اضغط للتسجيل' : 'Tap record to start')}</p>
                </div>
              ) : (
                transcript.map((segment) => (
                  <div key={segment.id} className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{segment.speaker}</span>
                      <span>•</span>
                      <span>{segment.timestamp.toLocaleTimeString()}</span>
                    </div>
                    <p className={`${segment.isFinal ? 'text-foreground' : 'text-muted-foreground italic'}`}>
                      {segment.text}
                    </p>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* AI Suggestions */}
        <div className="p-4 border-t border-border">
          <h3 className="font-medium mb-3">{t.aiInsights}</h3>
          <ScrollArea className="h-32">
            <div className="space-y-2">
              {suggestions.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-4">
                  {t.noSuggestions}
                </p>
              ) : (
                suggestions.slice(-3).map((suggestion, index) => {
                  const Icon = getSuggestionIcon(suggestion.type);
                  return (
                    <div key={index} className={`p-3 rounded-lg border ${getSuggestionColor(suggestion.type)}`}>
                      <div className="flex items-start gap-2">
                        <Icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium capitalize">{t[suggestion.type]}</p>
                          <p className="text-xs mt-1">{suggestion.content}</p>
                          {suggestion.confidence && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {Math.round(suggestion.confidence * 100)}% {language === 'ar' ? 'دقة' : 'confidence'}
                            </p>
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

      {/* Controls */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center justify-center gap-2">
          <Button
            onClick={() => setIsRecording(!isRecording)}
            variant={isRecording ? "destructive" : "default"}
            size="lg"
            className="flex-1 h-12"
          >
            {isRecording ? (
              <>
                <Square className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {t.stopRecording}
              </>
            ) : (
              <>
                <Mic className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {transcript.length > 0 ? t.resumeRecording : t.startRecording}
              </>
            )}
          </Button>
          
          {transcript.length > 0 && (
            <Button
              variant="outline"
              size="lg"
              onClick={saveSession}
              disabled={isSaving}
              className="h-12"
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