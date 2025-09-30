import { Globe, Shield, Bell, Trash2, Info, ExternalLink, Sparkles, Zap, Gem } from 'lucide-react';
import { Switch } from '../ui/switch';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';

interface SettingsScreenProps {
  language: 'ar' | 'en';
  onLanguageChange: (language: 'ar' | 'en') => void;
}

export default function LuxurySettingsScreen({ 
  language, 
  onLanguageChange 
}: SettingsScreenProps) {
  const isRTL = language === 'ar';

  const text = {
    ar: {
      settings: 'الإعدادات',
      personalPreferences: 'التفضيلات الشخصية',
      language: 'اللغة',
      languageDesc: 'اختر لغة التطبيق المفضلة',
      arabic: 'العربية',
      english: 'English',

      privacySecurity: 'الخصوصية والأمان',
      autoDelete: 'الحذف التلقائي',
      autoDeleteDesc: 'حذف الملاحظات تلقائياً بعد 30 يوم',
      dataEncryption: 'تشفير البيانات',
      dataEncryptionDesc: 'تشفير جميع البيانات المحفوظة محلياً',
      intelligentFeatures: 'الميزات الذكية',
      aiInsights: 'الرؤى الذكية',
      aiInsightsDesc: 'تحليل ذكي للمحتوى والاقتراحات',
      realTimeProcessing: 'المعالجة الفورية',
      realTimeProcessingDesc: 'تحليل المحتوى أثناء التسجيل',
      notifications: 'الإشعارات',
      meetingReminders: 'تذكير الاجتماعات',
      meetingRemindersDesc: 'تذكير قبل الاجتماعات المجدولة',
      taskReminders: 'تذكير المهام',
      taskRemindersDesc: 'تذكير بالمهام المستحقة',
      dataManagement: 'إدارة البيانات',
      clearData: 'مسح جميع البيانات',
      clearDataDesc: 'حذف جميع الملاحظات والإعدادات',
      exportData: 'تصدير البيانات',
      exportDataDesc: 'تصدير جميع الملاحظات والتحليلات',
      about: 'حول التطبيق',
      version: 'الإصدار',
      support: 'الدعم التقني',
      privacy_policy: 'سياسة الخصوصية',
      terms: 'شروط الاستخدام',
      luxuryExperience: 'تجربة فاخرة',
      aiPowered: 'مدعوم بالذكاء الاصطناعي'
    },
    en: {
      settings: 'Settings',
      personalPreferences: 'Personal Preferences',
      language: 'Language',
      languageDesc: 'Choose your preferred app language',
      arabic: 'العربية',
      english: 'English',

      privacySecurity: 'Privacy & Security',
      autoDelete: 'Auto-delete',
      autoDeleteDesc: 'Automatically delete notes after 30 days',
      dataEncryption: 'Data encryption',
      dataEncryptionDesc: 'Encrypt all locally saved data',
      intelligentFeatures: 'Intelligent Features',
      aiInsights: 'AI Insights',
      aiInsightsDesc: 'Smart content analysis and suggestions',
      realTimeProcessing: 'Real-time Processing',
      realTimeProcessingDesc: 'Analyze content during recording',
      notifications: 'Notifications',
      meetingReminders: 'Meeting reminders',
      meetingRemindersDesc: 'Remind before scheduled meetings',
      taskReminders: 'Task reminders',
      taskRemindersDesc: 'Remind about due tasks',
      dataManagement: 'Data Management',
      clearData: 'Clear all data',
      clearDataDesc: 'Delete all notes and settings',
      exportData: 'Export data',
      exportDataDesc: 'Export all notes and analytics',
      about: 'About',
      version: 'Version',
      support: 'Technical Support',
      privacy_policy: 'Privacy Policy',
      terms: 'Terms of Service',
      luxuryExperience: 'Luxury Experience',
      aiPowered: 'AI-Powered'
    }
  };

  const t = text[language];

  const SettingItem = ({ 
    icon: Icon, 
    title, 
    description, 
    action, 
    variant = 'default',
    accent = false
  }: { 
    icon: any; 
    title: string; 
    description: string; 
    action: React.ReactNode;
    variant?: 'default' | 'destructive';
    accent?: boolean;
  }) => (
    <div className="glass-surface p-4 rounded-xl border border-glass-border group hover-glow elegant-transition relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent group-hover:animate-crystal-shimmer"></div>
      
      <div className="flex items-center gap-4 relative z-10">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
          variant === 'destructive' 
            ? 'bg-gradient-to-br from-red-500/20 to-red-600/10 border border-red-400/30' 
            : accent
            ? 'bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30 crystal-glow'
            : 'glass-surface border border-glass-border'
        }`}>
          <Icon className={`h-6 w-6 ${
            variant === 'destructive' ? 'text-red-400' : accent ? 'text-primary' : 'text-silver-medium'
          }`} />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="font-medium text-silver-light group-hover:silver-text elegant-transition">{title}</p>
          <p className="text-sm text-silver-dark mt-1 leading-relaxed">{description}</p>
        </div>
        
        <div className="flex-shrink-0 bg-[rgba(0,0,0,0)]">
          {action}
        </div>
      </div>
    </div>
  );



  const LanguageSelector = () => (
    <div className="flex rounded-xl glass-surface border border-glass-border overflow-hidden">
      {[
        { id: 'ar' as const, label: t.arabic },
        { id: 'en' as const, label: t.english }
      ].map((lang, index) => (
        <button
          key={lang.id}
          onClick={() => onLanguageChange(lang.id)}
          className={`flex-1 py-3 px-4 text-sm elegant-transition ${
            language === lang.id 
              ? 'bg-primary text-white crystal-glow' 
              : 'text-silver-medium hover:text-silver-light hover:bg-glass-background'
          }`}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );

  const SectionDivider = ({ title }: { title: string }) => (
    <div className="flex items-center gap-3 my-6">
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-silver-dark/30 to-transparent"></div>
      <h3 className="text-silver-medium text-sm font-medium tracking-wider uppercase">
        {title}
      </h3>
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-silver-dark/30 to-transparent"></div>
    </div>
  );

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 space-y-6">
        {/* Header */}
        <div className="glass-surface rounded-xl p-6 border border-glass-border relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent"></div>
          
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-16 h-16 glass-surface rounded-2xl flex items-center justify-center crystal-glow">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-light silver-text">{t.settings}</h2>
              <p className="text-sm text-silver-dark mt-1">{t.luxuryExperience} • {t.aiPowered}</p>
            </div>
          </div>
        </div>

        {/* Personal Preferences Section */}
        <SectionDivider title={t.personalPreferences} />
        
        <div className="space-y-3">
          <SettingItem
            icon={Globe}
            title={t.language}
            description={t.languageDesc}
            action={<LanguageSelector />}
            accent={true}
          />
        </div>

        {/* Intelligent Features Section */}
        <SectionDivider title={t.intelligentFeatures} />
        
        <div className="space-y-3">
          <SettingItem
            icon={Zap}
            title={t.aiInsights}
            description={t.aiInsightsDesc}
            action={<Switch defaultChecked className="data-[state=checked]:bg-primary" />}
            accent={true}
          />
          
          <SettingItem
            icon={Gem}
            title={t.realTimeProcessing}
            description={t.realTimeProcessingDesc}
            action={<Switch defaultChecked className="data-[state=checked]:bg-primary" />}
            accent={true}
          />
        </div>

        {/* Privacy & Security Section */}
        <SectionDivider title={t.privacySecurity} />
        
        <div className="space-y-3">
          <SettingItem
            icon={Trash2}
            title={t.autoDelete}
            description={t.autoDeleteDesc}
            action={<Switch defaultChecked className="data-[state=checked]:bg-primary" />}
          />
          
          <SettingItem
            icon={Shield}
            title={t.dataEncryption}
            description={t.dataEncryptionDesc}
            action={<Switch defaultChecked disabled className="data-[state=checked]:bg-primary" />}
          />
        </div>

        {/* Notifications Section */}
        <SectionDivider title={t.notifications} />
        
        <div className="space-y-3">
          <SettingItem
            icon={Bell}
            title={t.meetingReminders}
            description={t.meetingRemindersDesc}
            action={<Switch defaultChecked className="data-[state=checked]:bg-primary" />}
          />
          
          <SettingItem
            icon={Bell}
            title={t.taskReminders}
            description={t.taskRemindersDesc}
            action={<Switch defaultChecked className="data-[state=checked]:bg-primary" />}
          />
        </div>

        {/* Data Management Section */}
        <SectionDivider title={t.dataManagement} />
        
        <div className="space-y-3">
          <SettingItem
            icon={ExternalLink}
            title={t.exportData}
            description={t.exportDataDesc}
            action={
              <Button className="bg-glass-background border border-glass-border hover:bg-primary/10 text-silver-light hover:text-primary elegant-transition">
                {language === 'ar' ? 'تصدير' : 'Export'}
              </Button>
            }
          />
          
          <SettingItem
            icon={Trash2}
            title={t.clearData}
            description={t.clearDataDesc}
            action={
              <Button variant="destructive" size="sm" className="bg-red-500/20 border border-red-400/30 text-red-300 hover:bg-red-500/30">
                {language === 'ar' ? 'مسح' : 'Clear'}
              </Button>
            }
            variant="destructive"
          />
        </div>

        {/* About Section */}
        <SectionDivider title={t.about} />
        
        <div className="space-y-3">
          <SettingItem
            icon={Info}
            title={t.version}
            description="Azora AI NoteTaker v1.0.0 • Luxury Edition"
            action={<span className="text-sm text-silver-dark">1.0.0</span>}
          />
          
          <SettingItem
            icon={ExternalLink}
            title={t.support}
            description=""
            action={
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-silver-medium hover:text-primary">
                <ExternalLink className="h-4 w-4" />
              </Button>
            }
          />
          
          <SettingItem
            icon={Shield}
            title={t.privacy_policy}
            description=""
            action={
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-silver-medium hover:text-primary">
                <ExternalLink className="h-4 w-4" />
              </Button>
            }
          />
          
          <SettingItem
            icon={Info}
            title={t.terms}
            description=""
            action={
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-silver-medium hover:text-primary">
                <ExternalLink className="h-4 w-4" />
              </Button>
            }
          />
        </div>

        {/* Footer */}
        <div className="glass-surface rounded-xl p-6 text-center border border-glass-border relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent"></div>
          <div className="relative z-10">
            <p className="text-xs text-silver-dark leading-relaxed">
              Azora AI NoteTaker © 2024
            </p>
            <p className="text-xs text-silver-dark mt-1">
              {language === 'ar' ? 'تجربة ذكية فاخرة' : 'Luxury AI Experience'}
            </p>
          </div>
        </div>

        {/* Bottom Spacing */}
        <div className="h-4"></div>
      </div>
    </div>
  );
}