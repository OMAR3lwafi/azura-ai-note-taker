import { Mic, Video, FileText, ArrowRight } from 'lucide-react';
import { Button } from './ui/button';

interface HomeScreenProps {
  language: 'ar' | 'en';
  onStartSession: () => void;
}

export default function HomeScreen({ language, onStartSession }: HomeScreenProps) {
  const isRTL = language === 'ar';

  const text = {
    ar: {
      title: 'أزورا مساعد الملاحظات الذكي',
      subtitle: 'مساعدك الذكي في الاجتماعات',
      startMeeting: 'بدء اجتماع جديد',
      liveTranscription: 'النسخ المباشر',
      liveTranscriptionDesc: 'بدء تدوين الملاحظات في الوقت الفعلي',
      importVideo: 'استيراد فيديو',
      importVideoDesc: 'تحليل تسجيل فيديو موجود',
      browseNotes: 'تصفح الملاحظات',
      browseNotesDesc: 'عرض الملاحظات المحفوظة',
      quickActions: 'الإجراءات السريعة'
    },
    en: {
      title: 'Azora AI NoteTaker',
      subtitle: 'Your intelligent meeting companion',
      startMeeting: 'Start New Meeting',
      liveTranscription: 'Live Transcription',
      liveTranscriptionDesc: 'Start real-time note taking',
      importVideo: 'Import Video',
      importVideoDesc: 'Analyze existing video recording',
      browseNotes: 'Browse Notes',
      browseNotesDesc: 'View saved meeting notes',
      quickActions: 'Quick Actions'
    }
  };

  const t = text[language];

  const quickActions = [
    {
      icon: Mic,
      title: t.liveTranscription,
      subtitle: t.liveTranscriptionDesc,
      color: 'bg-blue-500/10 text-blue-600',
      action: onStartSession
    },
    {
      icon: Video,
      title: t.importVideo,
      subtitle: t.importVideoDesc,
      color: 'bg-purple-500/10 text-purple-600',
      action: () => {}
    },
    {
      icon: FileText,
      title: t.browseNotes,
      subtitle: t.browseNotesDesc,
      color: 'bg-green-500/10 text-green-600',
      action: () => {}
    }
  ];

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 space-y-6">
        {/* Hero Section */}
        <div className="text-center space-y-4 py-8">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
            <Mic className="h-8 w-8 text-primary" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-medium">{t.title}</h2>
            <p className="text-muted-foreground">{t.subtitle}</p>
          </div>
          <Button onClick={onStartSession} className="w-full h-12 text-lg">
            {t.startMeeting}
            <ArrowRight className={`h-5 w-5 ${isRTL ? 'mr-2 rotate-180' : 'ml-2'}`} />
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <h3 className="font-medium">{t.quickActions}</h3>
          <div className="grid grid-cols-1 gap-3">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <button
                  key={index}
                  onClick={action.action}
                  className="flex items-center gap-4 p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors text-left"
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${action.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{action.title}</p>
                    <p className="text-sm text-muted-foreground">{action.subtitle}</p>
                  </div>
                  <ArrowRight className={`h-5 w-5 text-muted-foreground ${isRTL ? 'rotate-180' : ''}`} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Recent Activity Preview */}
        <div className="space-y-4">
          <h3 className="font-medium">
            {language === 'ar' ? 'النشاط الأخير' : 'Recent Activity'}
          </h3>
          <div className="rounded-lg border border-dashed border-border p-8 text-center">
            <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">
              {language === 'ar' 
                ? 'لا توجد اجتماعات محفوظة بعد' 
                : 'No saved meetings yet'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}