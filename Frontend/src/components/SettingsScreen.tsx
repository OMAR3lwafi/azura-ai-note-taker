import { Globe, Moon, Sun, Monitor, Shield, Bell, Trash2, Info, ExternalLink } from 'lucide-react';
import { Switch } from './ui/switch';
import { Button } from './ui/button';
import { Separator } from './ui/separator';

interface SettingsScreenProps {
  language: 'ar' | 'en';
  onLanguageChange: (language: 'ar' | 'en') => void;
  isDark: boolean;
  onThemeChange: (isDark: boolean) => void;
}

export default function SettingsScreen({ 
  language, 
  onLanguageChange, 
  isDark, 
  onThemeChange 
}: SettingsScreenProps) {
  const isRTL = language === 'ar';

  const text = {
    ar: {
      settings: 'الإعدادات',
      general: 'عام',
      language: 'اللغة',
      languageDesc: 'اختر لغة التطبيق',
      arabic: 'العربية',
      english: 'English',
      theme: 'المظهر',
      themeDesc: 'اختر مظهر التطبيق',
      light: 'فاتح',
      dark: 'داكن',
      system: 'النظام',
      privacy: 'الخصوصية والأمان',
      autoDelete: 'حذف تلقائي',
      autoDeleteDesc: 'حذف الملاحظات تلقائياً بعد 30 يوم',
      dataEncryption: 'تشفير البيانات',
      dataEncryptionDesc: 'تشفير جميع البيانات المحفوظة',
      notifications: 'الإشعارات',
      meetingReminders: 'تذكير الاجتماعات',
      meetingRemindersDesc: 'تذكير قبل الاجتماعات المجدولة',
      taskReminders: 'تذكير المهام',
      taskRemindersDesc: 'تذكير بالمهام المستحقة',
      data: 'البيانات',
      clearData: 'مسح جميع البيانات',
      clearDataDesc: 'حذف جميع الملاحظات والإعدادات',
      exportData: 'تصدير البيانات',
      exportDataDesc: 'تصدير جميع الملاحظات',
      about: 'حول التطبيق',
      version: 'الإصدار',
      support: 'الدعم',
      privacy_policy: 'سياسة الخصوصية',
      terms: 'شروط الاستخدام'
    },
    en: {
      settings: 'Settings',
      general: 'General',
      language: 'Language',
      languageDesc: 'Choose app language',
      arabic: 'العربية',
      english: 'English',
      theme: 'Theme',
      themeDesc: 'Choose app appearance',
      light: 'Light',
      dark: 'Dark',
      system: 'System',
      privacy: 'Privacy & Security',
      autoDelete: 'Auto-delete',
      autoDeleteDesc: 'Automatically delete notes after 30 days',
      dataEncryption: 'Data encryption',
      dataEncryptionDesc: 'Encrypt all saved data',
      notifications: 'Notifications',
      meetingReminders: 'Meeting reminders',
      meetingRemindersDesc: 'Remind before scheduled meetings',
      taskReminders: 'Task reminders',
      taskRemindersDesc: 'Remind about due tasks',
      data: 'Data',
      clearData: 'Clear all data',
      clearDataDesc: 'Delete all notes and settings',
      exportData: 'Export data',
      exportDataDesc: 'Export all meeting notes',
      about: 'About',
      version: 'Version',
      support: 'Support',
      privacy_policy: 'Privacy Policy',
      terms: 'Terms of Service'
    }
  };

  const t = text[language];

  const SettingItem = ({ 
    icon: Icon, 
    title, 
    description, 
    action, 
    variant = 'default' 
  }: { 
    icon: any; 
    title: string; 
    description: string; 
    action: React.ReactNode;
    variant?: 'default' | 'destructive';
  }) => (
    <div className="flex items-center gap-3 py-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
        variant === 'destructive' ? 'bg-destructive/10' : 'bg-accent'
      }`}>
        <Icon className={`h-5 w-5 ${
          variant === 'destructive' ? 'text-destructive' : 'text-foreground'
        }`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="flex-shrink-0">
        {action}
      </div>
    </div>
  );

  const ThemeSelector = () => (
    <div className="flex rounded-lg border border-border">
      {[
        { id: 'light', label: t.light, icon: Sun },
        { id: 'dark', label: t.dark, icon: Moon },
        { id: 'system', label: t.system, icon: Monitor }
      ].map((theme, index) => {
        const Icon = theme.icon;
        const isActive = (theme.id === 'light' && !isDark) || 
                        (theme.id === 'dark' && isDark) || 
                        theme.id === 'system';
        
        return (
          <button
            key={theme.id}
            onClick={() => {
              if (theme.id === 'light') onThemeChange(false);
              else if (theme.id === 'dark') onThemeChange(true);
              // System theme would require additional logic
            }}
            className={`flex-1 flex flex-col items-center gap-1 py-3 px-2 text-xs transition-colors ${
              isActive 
                ? 'bg-primary text-primary-foreground' 
                : 'text-muted-foreground hover:text-foreground'
            } ${
              index === 0 ? 'rounded-l-lg' : 
              index === 2 ? 'rounded-r-lg' : ''
            }`}
            disabled={theme.id === 'system'} // Disable system for now
          >
            <Icon className="h-4 w-4" />
            <span>{theme.label}</span>
          </button>
        );
      })}
    </div>
  );

  const LanguageSelector = () => (
    <div className="flex rounded-lg border border-border">
      {[
        { id: 'ar' as const, label: t.arabic },
        { id: 'en' as const, label: t.english }
      ].map((lang, index) => (
        <button
          key={lang.id}
          onClick={() => onLanguageChange(lang.id)}
          className={`flex-1 py-2 px-3 text-sm transition-colors ${
            language === lang.id 
              ? 'bg-primary text-primary-foreground' 
              : 'text-muted-foreground hover:text-foreground'
          } ${
            index === 0 ? 'rounded-l-lg' : 'rounded-r-lg'
          }`}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 space-y-6">
        <h2 className="font-medium">{t.settings}</h2>

        {/* General Section */}
        <div className="space-y-1">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
            {t.general}
          </h3>
          
          <SettingItem
            icon={Globe}
            title={t.language}
            description={t.languageDesc}
            action={<LanguageSelector />}
          />
          
          <SettingItem
            icon={Monitor}
            title={t.theme}
            description={t.themeDesc}
            action={<ThemeSelector />}
          />
        </div>

        <Separator />

        {/* Privacy & Security Section */}
        <div className="space-y-1">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
            {t.privacy}
          </h3>
          
          <SettingItem
            icon={Trash2}
            title={t.autoDelete}
            description={t.autoDeleteDesc}
            action={<Switch defaultChecked />}
          />
          
          <SettingItem
            icon={Shield}
            title={t.dataEncryption}
            description={t.dataEncryptionDesc}
            action={<Switch defaultChecked disabled />}
          />
        </div>

        <Separator />

        {/* Notifications Section */}
        <div className="space-y-1">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
            {t.notifications}
          </h3>
          
          <SettingItem
            icon={Bell}
            title={t.meetingReminders}
            description={t.meetingRemindersDesc}
            action={<Switch defaultChecked />}
          />
          
          <SettingItem
            icon={Bell}
            title={t.taskReminders}
            description={t.taskRemindersDesc}
            action={<Switch defaultChecked />}
          />
        </div>

        <Separator />

        {/* Data Section */}
        <div className="space-y-1">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
            {t.data}
          </h3>
          
          <SettingItem
            icon={ExternalLink}
            title={t.exportData}
            description={t.exportDataDesc}
            action={
              <Button variant="outline" size="sm">
                {language === 'ar' ? 'تصدير' : 'Export'}
              </Button>
            }
          />
          
          <SettingItem
            icon={Trash2}
            title={t.clearData}
            description={t.clearDataDesc}
            action={
              <Button variant="destructive" size="sm">
                {language === 'ar' ? 'مسح' : 'Clear'}
              </Button>
            }
            variant="destructive"
          />
        </div>

        <Separator />

        {/* About Section */}
        <div className="space-y-1">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
            {t.about}
          </h3>
          
          <SettingItem
            icon={Info}
            title={t.version}
            description="1.0.0"
            action={<span className="text-sm text-muted-foreground">1.0.0</span>}
          />
          
          <SettingItem
            icon={ExternalLink}
            title={t.support}
            description=""
            action={
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <ExternalLink className="h-4 w-4" />
              </Button>
            }
          />
          
          <SettingItem
            icon={Shield}
            title={t.privacy_policy}
            description=""
            action={
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <ExternalLink className="h-4 w-4" />
              </Button>
            }
          />
          
          <SettingItem
            icon={Info}
            title={t.terms}
            description=""
            action={
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <ExternalLink className="h-4 w-4" />
              </Button>
            }
          />
        </div>

        {/* Footer */}
        <div className="text-center py-8 text-xs text-muted-foreground">
          Azora AI NoteTaker © 2024
        </div>
      </div>
    </div>
  );
}