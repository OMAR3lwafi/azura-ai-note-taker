import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Square, Lightbulb, CheckCircle, FileText } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';

interface SessionScreenProps {
  language: 'ar' | 'en';
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
}

export default function SessionScreen({ language }: SessionScreenProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptSegment[]>([]);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [sessionDuration, setSessionDuration] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout>();

  const isRTL = language === 'ar';

  const text = {
    ar: {
      sessionTitle: 'جلسة مباشرة',
      startRecording: 'بدء التسجيل',
      stopRecording: 'إيقاف التسجيل',
      resumeRecording: 'استئناف التسجيل',
      endSession: 'إنهاء الجلسة',
      listening: 'جاري الاستماع...',
      paused: 'متوقف',
      aiInsights: 'رؤى الذكاء الاصطناعي',
      summary: 'ملخص',
      decision: 'قرار',
      action: 'إجراء',
      insight: 'رؤية',
      noSuggestions: 'لا توجد اقتراحات بعد...',
      transcript: 'النص المكتوب',
      speaker: 'المتحدث'
    },
    en: {
      sessionTitle: 'Live Session',
      startRecording: 'Start Recording',
      stopRecording: 'Stop Recording',
      resumeRecording: 'Resume Recording',
      endSession: 'End Session',
      listening: 'Listening...',
      paused: 'Paused',
      aiInsights: 'AI Insights',
      summary: 'Summary',
      decision: 'Decision',
      action: 'Action',
      insight: 'Insight',
      noSuggestions: 'No suggestions yet...',
      transcript: 'Transcript',
      speaker: 'Speaker'
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
      'سأتولى مسؤولية التواصل مع العملاء'
    ],
    en: [
      'Welcome to today\'s meeting, we\'ll discuss the new project plan',
      'We need to set the project deadline within this week',
      'I suggest we divide the work into three main phases',
      'Can the technical team prepare the report by Friday?',
      'I\'ll take responsibility for client communication'
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

      // Generate AI suggestions periodically
      if (Math.random() > 0.7) {
        const suggestionTypes = ['summary', 'decision', 'action', 'insight'] as const;
        const randomType = suggestionTypes[Math.floor(Math.random() * suggestionTypes.length)];
        
        const suggestionContent = {
          ar: {
            summary: 'الفريق يناقش خطة المشروع الجديد وتقسيم المهام',
            decision: 'تم الاتفاق على تحديد موعد نهائي للمشروع هذا الأسبوع',
            action: 'الفريق التقني سيعد التقرير بحلول الجمعة',
            insight: 'يبدو أن التواصل مع العملاء نقطة مهمة في المناقشة'
          },
          en: {
            summary: 'Team discussing new project plan and task division',
            decision: 'Agreed to set project deadline within this week',
            action: 'Technical team will prepare report by Friday',
            insight: 'Client communication seems to be a key discussion point'
          }
        };

        const newSuggestion: AISuggestion = {
          type: randomType,
          content: suggestionContent[language][randomType],
          timestamp: new Date()
        };

        setSuggestions(prev => [...prev, newSuggestion]);
      }
    }, 3000 + Math.random() * 2000); // Random interval between 3-5 seconds

    return () => clearInterval(interval);
  }, [isRecording, language, t.speaker]);

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
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-medium">{t.sessionTitle}</h2>
            <p className="text-sm text-muted-foreground">
              {isRecording ? t.listening : t.paused} • {formatDuration(sessionDuration)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isRecording && (
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
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
                  <p>{isRecording ? t.listening : 'Tap record to start'}</p>
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
        <div className="flex items-center justify-center gap-4">
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
              onClick={() => {
                setIsRecording(false);
                setTranscript([]);
                setSuggestions([]);
                setSessionDuration(0);
              }}
            >
              {t.endSession}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}