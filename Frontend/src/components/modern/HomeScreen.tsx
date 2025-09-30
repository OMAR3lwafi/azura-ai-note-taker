import * as React from 'react';
import { Mic, FileText, Sparkles, Zap } from 'lucide-react';
import { Button } from '../ui/button';
import { Card3D, Card3DHeader, Card3DTitle, Card3DDescription, Card3DContent } from '../ui/card-3d';

interface HomeScreenProps {
  language: 'ar' | 'en';
  onStartSession: () => void;
  onNavigate?: (screen: string) => void;
}

export default function HomeScreen({ language, onStartSession, onNavigate }: HomeScreenProps) {
  const isRTL = language === 'ar';

  const content = {
    ar: {
      title: 'أزورا',
      subtitle: 'مساعدك الذكي للاجتماعات',
      startSession: 'بدء جلسة جديدة',
      quickActions: 'إجراءات سريعة',
      recentActivity: 'النشاط الأخير',
      noActivity: 'لا توجد جلسات حتى الآن',
      startFirst: 'ابدأ أول جلسة لك الآن',
      actions: [
        {
          icon: Mic,
          title: 'تسجيل صوتي',
          description: 'ابدأ تسجيل اجتماع جديد',
          color: 'blue',
        },
        {
          icon: FileText,
          title: 'معرض الجلسات',
          description: 'تصفح جلساتك السابقة',
          color: 'purple',
        },
        {
          icon: Sparkles,
          title: 'ملخصات ذكية',
          description: 'احصل على ملخصات تلقائية',
          color: 'cyan',
        },
      ],
    },
    en: {
      title: 'Azora',
      subtitle: 'Your AI Meeting Assistant',
      startSession: 'Start New Session',
      quickActions: 'Quick Actions',
      recentActivity: 'Recent Activity',
      noActivity: 'No sessions yet',
      startFirst: 'Start your first session now',
      actions: [
        {
          icon: Mic,
          title: 'Voice Recording',
          description: 'Start a new meeting recording',
          color: 'blue',
        },
        {
          icon: FileText,
          title: 'Session Gallery',
          description: 'Browse your past sessions',
          color: 'purple',
        },
        {
          icon: Sparkles,
          title: 'Smart Summaries',
          description: 'Get automatic summaries',
          color: 'cyan',
        },
      ],
    },
  };

  const t = content[language];

  const glowColors = {
    blue: 'rgba(59, 130, 246, 0.4)',
    purple: 'rgba(168, 85, 247, 0.4)',
    cyan: 'rgba(6, 182, 212, 0.4)',
  };

  return (
    <div className="h-full overflow-y-auto luxury-scrollbar">
      <div className="min-h-full flex flex-col p-4 pb-8">
        {/* Hero Section */}
        <div className="mb-8 text-center animate-in fade-in-0 slide-in-from-top-4 duration-700">
          <Card3D
            variant="holographic"
            tiltEnabled
            tiltIntensity={0.2}
            animated
            className="mb-6"
          >
            <div className="flex flex-col items-center py-8">
              {/* Animated logo container */}
              <div className="relative mb-4">
                <div className="absolute inset-0 bg-primary blur-3xl opacity-50 animate-glow-pulse" />
                <div className="relative">
                  <Zap className="h-16 w-16 text-primary animate-floating" />
                </div>
              </div>

              {/* App title with holographic effect */}
              <h1 className="text-4xl font-bold mb-2 text-holographic">
                {t.title}
              </h1>
              <p className="text-white/70 text-lg">
                {t.subtitle}
              </p>
            </div>
          </Card3D>

          {/* Main CTA */}
          <Button
            variant="gradient3d"
            size="2xl"
            onClick={onStartSession}
            className="w-full max-w-xs mx-auto shadow-[0_0_40px_rgba(59,130,246,0.5)] hover:shadow-[0_0_60px_rgba(59,130,246,0.7)] animate-in fade-in-0 zoom-in-95 duration-500 delay-200"
          >
            <Mic className="h-6 w-6" />
            {t.startSession}
          </Button>
        </div>

        {/* Quick Actions Grid */}
        <div className="mb-8 animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-300">
          <h2 className="text-xl font-semibold text-white/90 mb-4 px-2">
            {t.quickActions}
          </h2>
          
          <div className="grid grid-cols-1 gap-4">
            {t.actions.map((action, index) => {
              const Icon = action.icon;
              const glowColor = glowColors[action.color as keyof typeof glowColors];
              
              return (
                <Card3D
                  key={index}
                  variant="glass"
                  tiltEnabled
                  interactive
                  glowColor={glowColor}
                  className="group cursor-pointer animate-in fade-in-0 slide-in-from-bottom-4"
                  style={{
                    animationDelay: `${(index + 1) * 150}ms`,
                  }}
                  onClick={() => {
                    if (index === 0) onStartSession();
                    else if (index === 1) onNavigate?.('gallery');
                  }}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon container with glow */}
                    <div 
                      className={cn(
                        "flex-shrink-0 w-12 h-12 rounded-xl",
                        "flex items-center justify-center",
                        "bg-white/10 backdrop-blur-md border border-white/20",
                        "group-hover:scale-110 transition-transform duration-300",
                        "relative"
                      )}
                      style={{
                        boxShadow: `0 0 20px ${glowColor}, inset 0 1px 0 rgba(255,255,255,0.2)`,
                      }}
                    >
                      <Icon className="h-6 w-6 text-white" />
                      
                      {/* Glow pulse on hover */}
                      <div 
                        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity blur-lg"
                        style={{ background: glowColor }}
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-holographic transition-colors">
                        {action.title}
                      </h3>
                      <p className="text-sm text-white/60 leading-relaxed">
                        {action.description}
                      </p>
                    </div>

                    {/* Arrow indicator */}
                    <div className={cn(
                      "flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-300",
                      isRTL ? "mr-2 group-hover:-translate-x-1" : "ml-2 group-hover:translate-x-1"
                    )}>
                      <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                        <span className="text-white text-sm">{isRTL ? '←' : '→'}</span>
                      </div>
                    </div>
                  </div>
                </Card3D>
              );
            })}
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-500">
          <h2 className="text-xl font-semibold text-white/90 mb-4 px-2">
            {t.recentActivity}
          </h2>
          
          <Card3D
            variant="frosted"
            className="text-center py-12"
          >
            {/* Empty state with animated icon */}
            <div className="flex flex-col items-center">
              <div className="relative mb-4">
                <div className="absolute inset-0 bg-white/10 blur-2xl animate-ambient-glow" />
                <FileText className="h-12 w-12 text-white/40 animate-floating relative" />
              </div>
              
              <p className="text-white/60 mb-2 text-lg font-medium">
                {t.noActivity}
              </p>
              <p className="text-white/40 text-sm">
                {t.startFirst}
              </p>
            </div>
          </Card3D>
        </div>

        {/* Background effects */}
        <div className="fixed inset-0 pointer-events-none -z-10">
          {/* Floating orbs */}
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl animate-floating" />
          <div className="absolute top-1/2 right-1/4 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl animate-floating" style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-1/4 left-1/3 w-36 h-36 bg-cyan-500/10 rounded-full blur-3xl animate-floating" style={{ animationDelay: '2s' }} />
        </div>
      </div>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
