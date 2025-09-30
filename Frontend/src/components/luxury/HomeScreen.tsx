import { Mic, Video, FileText, ArrowRight, Sparkles, Zap, Headphones } from 'lucide-react';
import { Button } from '../ui/button';

interface HomeScreenProps {
  language: 'ar' | 'en';
  onStartSession: () => void;
}

export default function LuxuryHomeScreen({ language, onStartSession }: HomeScreenProps) {
  const isRTL = language === 'ar';

  const text = {
    ar: {
      welcome: 'مرحباً بك في',
      appName: 'أزورا',
      subtitle: 'مساعد الملاحظات الذكي',
      description: 'تجربة متطورة لتدوين الملاحظات مع الذكاء الاصطناعي',
      startMeeting: 'بدء جلسة جديدة',
      liveTranscription: 'النسخ المباشر',
      liveTranscriptionDesc: 'تحويل الكلام إلى نص فوري',
      importVideo: 'تحليل فيديو',
      importVideoDesc: 'استخراج الرؤى من التسجيلات',
      browseNotes: 'معرض الملاحظات',
      browseNotesDesc: 'تصفح وإدارة ملاحظاتك',
      quickActions: 'الوصول السريع',
      recentActivity: 'النشاط الأخير',
      noActivity: 'لا توجد جلسات محفوظة بعد',
      startFirst: 'ابدأ جلستك الأولى لتجربة قوة الذكاء الاصطناعي'
    },
    en: {
      welcome: 'Welcome to',
      appName: 'Azora',
      subtitle: 'AI-Powered NoteTaker',
      description: 'Advanced note-taking experience with artificial intelligence',
      startMeeting: 'Start New Session',
      liveTranscription: 'Live Transcription',
      liveTranscriptionDesc: 'Real-time speech to text',
      importVideo: 'Video Analysis',
      importVideoDesc: 'Extract insights from recordings',
      browseNotes: 'Notes Gallery',
      browseNotesDesc: 'Browse and manage your notes',
      quickActions: 'Quick Access',
      recentActivity: 'Recent Activity',
      noActivity: 'No saved sessions yet',
      startFirst: 'Start your first session to experience the power of AI'
    }
  };

  const t = text[language];

  const quickActions = [
    {
      icon: Mic,
      title: t.liveTranscription,
      subtitle: t.liveTranscriptionDesc,
      gradient: 'from-blue-400 via-blue-500 to-blue-600',
      glowColor: 'rgba(59, 130, 246, 0.3)',
      action: onStartSession
    },
    {
      icon: Video,
      title: t.importVideo,
      subtitle: t.importVideoDesc,
      gradient: 'from-purple-400 via-purple-500 to-purple-600',
      glowColor: 'rgba(147, 51, 234, 0.3)',
      action: () => {}
    },
    {
      icon: FileText,
      title: t.browseNotes,
      subtitle: t.browseNotesDesc,
      gradient: 'from-emerald-400 via-emerald-500 to-emerald-600',
      glowColor: 'rgba(16, 185, 129, 0.3)',
      action: () => {}
    }
  ];

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-6 py-8 relative">
          {/* Background Glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5 rounded-3xl blur-3xl"></div>
          
          <div className="relative z-10 space-y-4">
            {/* Logo/Icon */}
            <div className="relative mx-auto w-20 h-20 glass-surface rounded-2xl flex items-center justify-center crystal-glow animate-mirror-reflection">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl"></div>
              <Sparkles className="h-10 w-10 text-primary relative z-10" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-crystal-shimmer rounded-2xl"></div>
            </div>

            {/* Welcome Text */}
            <div className="space-y-2">
              <p className="text-silver-medium text-sm font-light tracking-wider uppercase">
                {t.welcome}
              </p>
              <h1 className="text-4xl font-thin silver-text mb-2">
                {t.appName}
              </h1>
              <h2 className="text-lg font-light text-silver-light">
                {t.subtitle}
              </h2>
              <p className="text-sm text-silver-dark max-w-xs mx-auto leading-relaxed">
                {t.description}
              </p>
            </div>

            {/* Main CTA Button */}
            <div className="pt-4">
              <Button 
                onClick={onStartSession} 
                className="w-full h-14 bg-gradient-to-r from-primary via-primary to-primary/80 hover:from-primary/90 hover:via-primary hover:to-primary text-white font-medium text-lg relative overflow-hidden group elegant-transition crystal-glow"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-crystal-shimmer"></div>
                <Zap className={`h-5 w-5 ${isRTL ? 'ml-3' : 'mr-3'} relative z-10`} />
                <span className="relative z-10">{t.startMeeting}</span>
                <ArrowRight className={`h-5 w-5 ${isRTL ? 'mr-3 rotate-180' : 'ml-3'} relative z-10 group-hover:translate-x-1 elegant-transition`} />
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-silver-dark/30 to-transparent"></div>
            <h3 className="text-silver-medium text-sm font-medium tracking-wider uppercase">
              {t.quickActions}
            </h3>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-silver-dark/30 to-transparent"></div>
          </div>
          
          <div className="grid gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <button
                  key={index}
                  onClick={action.action}
                  className="glass-surface p-4 rounded-xl group hover-glow elegant-transition relative overflow-hidden"
                  style={{
                    boxShadow: `0 4px 20px ${action.glowColor}, inset 0 1px 0 rgba(255, 255, 255, 0.1)`
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent group-hover:animate-crystal-shimmer"></div>
                  
                  <div className="flex items-center gap-4 relative z-10">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center crystal-glow`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    
                    <div className="flex-1 text-left min-w-0">
                      <h4 className="font-medium text-silver-light group-hover:silver-text elegant-transition">
                        {action.title}
                      </h4>
                      <p className="text-sm text-silver-dark mt-1">
                        {action.subtitle}
                      </p>
                    </div>
                    
                    <ArrowRight className={`h-5 w-5 text-silver-dark group-hover:text-primary elegant-transition ${isRTL ? 'rotate-180' : ''}`} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Recent Activity Preview */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-silver-dark/30 to-transparent"></div>
            <h3 className="text-silver-medium text-sm font-medium tracking-wider uppercase">
              {t.recentActivity}
            </h3>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-silver-dark/30 to-transparent"></div>
          </div>
          
          <div className="glass-surface rounded-xl p-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent"></div>
            
            <div className="relative z-10 space-y-4">
              <div className="w-16 h-16 mx-auto glass-surface rounded-full flex items-center justify-center">
                <Headphones className="h-8 w-8 text-silver-dark" />
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-silver-light">
                  {t.noActivity}
                </h4>
                <p className="text-sm text-silver-dark max-w-xs mx-auto leading-relaxed">
                  {t.startFirst}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Spacing */}
        <div className="h-4"></div>
      </div>
    </div>
  );
}