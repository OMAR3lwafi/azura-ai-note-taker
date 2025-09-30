import * as React from 'react';
import { Mic, Square, Pause, Settings, Lightbulb, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Card3D } from '../ui/card-3d';
import { Input3D } from '../ui/input-3d';

interface SessionScreenProps {
  language: 'ar' | 'en';
  onEndSession?: () => void;
  meetingId?: string;
}

export default function SessionScreen({ language, onEndSession }: SessionScreenProps) {
  const [isRecording, setIsRecording] = React.useState(false);
  const [duration, setDuration] = React.useState(0);
  const [title, setTitle] = React.useState('');

  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const content = {
    ar: {
      title: 'جلسة جديدة',
      titlePlaceholder: 'عنوان الجلسة...',
      transcript: 'النص المباشر',
      insights: 'الرؤى الذكية',
      noTranscript: 'في انتظار البدء...',
      noInsights: 'لا توجد رؤى حتى الآن',
      startRecording: 'ابدأ التسجيل',
      recording: 'جاري التسجيل',
      summary: 'الملخص',
      decision: 'قرار',
      action: 'إجراء',
      segments: [
        { speaker: 'المتحدث 1', text: 'مرحبا بكم في هذا الاجتماع...', time: '00:05' },
        { speaker: 'المتحدث 2', text: 'شكرا، دعونا نبدأ بمراجعة النقاط الرئيسية...', time: '00:12' },
      ],
      insights: [
        { type: 'summary', icon: Lightbulb, title: 'ملخص', content: 'تم مناقشة النقاط الرئيسية للمشروع', color: 'blue' },
        { type: 'decision', icon: CheckCircle2, title: 'قرار', content: 'الموافقة على الميزانية المقترحة', color: 'green' },
        { type: 'action', icon: AlertCircle, title: 'إجراء', content: 'إرسال التقرير بحلول نهاية الأسبوع', color: 'orange' },
      ],
    },
    en: {
      title: 'New Session',
      titlePlaceholder: 'Session title...',
      transcript: 'Live Transcript',
      insights: 'AI Insights',
      noTranscript: 'Waiting to start...',
      noInsights: 'No insights yet',
      startRecording: 'Start Recording',
      recording: 'Recording',
      summary: 'Summary',
      decision: 'Decision',
      action: 'Action',
      segments: [
        { speaker: 'Speaker 1', text: 'Welcome everyone to this meeting...', time: '00:05' },
        { speaker: 'Speaker 2', text: 'Thank you, let\'s start by reviewing the main points...', time: '00:12' },
      ],
      insights: [
        { type: 'summary', icon: Lightbulb, title: 'Summary', content: 'Main project points were discussed', color: 'blue' },
        { type: 'decision', icon: CheckCircle2, title: 'Decision', content: 'Approved the proposed budget', color: 'green' },
        { type: 'action', icon: AlertCircle, title: 'Action', content: 'Send report by end of week', color: 'orange' },
      ],
    },
  };

  const t = content[language];

  const glowColors = {
    blue: 'rgba(59, 130, 246, 0.5)',
    green: 'rgba(34, 197, 94, 0.5)',
    orange: 'rgba(249, 115, 22, 0.5)',
    red: 'rgba(239, 68, 68, 0.5)',
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 pb-2 animate-in fade-in-0 slide-in-from-top-2 duration-500">
        <Card3D variant="glass" className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              {/* Live indicator */}
              {isRecording && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500 animate-glow-pulse" />
                  <span className="text-sm font-medium text-red-400">
                    {t.recording}
                  </span>
                </div>
              )}
              
              {/* Timer */}
              <span className="text-lg font-mono text-white">
                {formatTime(duration)}
              </span>
            </div>

            <Button variant="ghost" size="icon-sm">
              <Settings className="h-4 w-4" />
            </Button>
          </div>

          {/* Title input */}
          <Input3D
            variant="floating"
            label={t.titlePlaceholder}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mb-0"
          />
        </Card3D>
      </div>

      {/* Main content - Split view */}
      <div className="flex-1 overflow-hidden px-4 pb-24">
        <div className="grid grid-cols-1 gap-4 h-full">
          {/* Transcript Panel */}
          <Card3D
            variant="frosted"
            className="overflow-hidden flex flex-col animate-in fade-in-0 slide-in-from-left-4 duration-500 delay-100"
          >
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <div className="w-1 h-4 bg-primary rounded-full" />
              {t.transcript}
            </h3>
            
            <div className="flex-1 overflow-y-auto luxury-scrollbar space-y-3">
              {isRecording ? (
                t.segments.map((segment, index) => (
                  <div
                    key={index}
                    className="p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors animate-in fade-in-0 slide-in-from-bottom-2"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-primary">
                        {segment.speaker}
                      </span>
                      <span className="text-xs text-white/50">
                        {segment.time}
                      </span>
                    </div>
                    <p className="text-sm text-white/80 leading-relaxed">
                      {segment.text}
                    </p>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-white/40">
                  <Mic className="h-12 w-12 mb-3 animate-floating" />
                  <p>{t.noTranscript}</p>
                </div>
              )}
            </div>

            {/* Waveform visualization placeholder */}
            {isRecording && (
              <div className="mt-3 pt-3 border-t border-white/10">
                <div className="flex items-end justify-center gap-1 h-8">
                  {[...Array(20)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1 bg-primary rounded-full animate-pulse"
                      style={{
                        height: `${Math.random() * 100}%`,
                        animationDelay: `${i * 50}ms`,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </Card3D>

          {/* AI Insights Panel */}
          <Card3D
            variant="frosted"
            className="overflow-hidden flex flex-col animate-in fade-in-0 slide-in-from-right-4 duration-500 delay-200"
          >
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              {t.insights}
            </h3>
            
            <div className="flex-1 overflow-y-auto luxury-scrollbar space-y-3">
              {isRecording ? (
                t.insights.map((insight, index) => {
                  const Icon = insight.icon;
                  const glowColor = glowColors[insight.color as keyof typeof glowColors];
                  
                  return (
                    <div
                      key={index}
                      className="p-4 rounded-xl bg-white/5 border border-white/10 hover:scale-[1.02] transition-transform animate-in fade-in-0 slide-in-from-right-2"
                      style={{
                        animationDelay: `${index * 150}ms`,
                        boxShadow: `0 0 20px ${glowColor}`,
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="flex-shrink-0 w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center"
                          style={{ boxShadow: `0 0 15px ${glowColor}` }}
                        >
                          <Icon className="h-5 w-5 text-white" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-white mb-1">
                            {insight.title}
                          </h4>
                          <p className="text-sm text-white/70 leading-relaxed">
                            {insight.content}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-white/40">
                  <Lightbulb className="h-12 w-12 mb-3 animate-floating" />
                  <p>{t.noInsights}</p>
                </div>
              )}
            </div>
          </Card3D>
        </div>
      </div>

      {/* Control Bar */}
      <div className="fixed bottom-20 left-0 right-0 px-4 animate-in fade-in-0 slide-in-from-bottom-4 duration-500 delay-300">
        <Card3D
          variant="glass"
          className="max-w-sm mx-auto p-4"
        >
          <div className="flex items-center justify-center gap-4">
            {/* Pause button */}
            {isRecording && (
              <Button variant="glass3d" size="icon-lg">
                <Pause className="h-6 w-6" />
              </Button>
            )}

            {/* Main record button */}
            <button
              onClick={() => setIsRecording(!isRecording)}
              className={cn(
                "relative w-20 h-20 rounded-full",
                "flex items-center justify-center",
                "transition-all duration-300",
                "hover:scale-110 active:scale-95",
                "focus:outline-none focus:ring-4 focus:ring-primary/50",
                isRecording
                  ? "bg-gradient-to-br from-red-500 to-red-600 shadow-[0_0_40px_rgba(239,68,68,0.6)] animate-glow-pulse"
                  : "bg-gradient-to-br from-blue-500 to-blue-600 shadow-[0_0_40px_rgba(59,130,246,0.6)]"
              )}
            >
              {/* Animated ring */}
              <div className={cn(
                "absolute inset-0 rounded-full border-2",
                isRecording ? "border-red-400/30" : "border-blue-400/30",
                "animate-glow-pulse"
              )} />
              
              {/* Icon */}
              {isRecording ? (
                <Square className="h-8 w-8 text-white fill-white" />
              ) : (
                <Mic className="h-8 w-8 text-white" />
              )}
            </button>

            {/* Stop button */}
            {isRecording && (
              <Button
                variant="destructive"
                size="icon-lg"
                onClick={onEndSession}
              >
                <Square className="h-6 w-6" />
              </Button>
            )}
          </div>
        </Card3D>
      </div>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
