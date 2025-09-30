import * as React from 'react';
import { Globe, Moon, Trash2, Info, LogOut, ChevronRight } from 'lucide-react';
import { Card3D } from '../ui/card-3d';
import { Button } from '../ui/button';

interface SettingsScreenProps {
  language: 'ar' | 'en';
  onLanguageChange?: (lang: 'ar' | 'en') => void;
  onLogout?: () => void;
}

export default function SettingsScreen({ language, onLanguageChange }: SettingsScreenProps) {
  const content = {
    ar: {
      title: 'الإعدادات',
      sections: {
        preferences: 'التفضيلات',
        general: 'عام',
        about: 'حول التطبيق',
      },
      settings: [
        { icon: Globe, title: 'اللغة', value: 'العربية', action: 'language' },
        { icon: Moon, title: 'المظهر', value: 'داكن', action: 'theme' },
        { icon: Trash2, title: 'مسح البيانات', value: '', action: 'clear' },
        { icon: Info, title: 'حول', value: 'الإصدار 1.0.0', action: 'about' },
        { icon: LogOut, title: 'تسجيل الخروج', value: '', action: 'logout' },
      ],
    },
    en: {
      title: 'Settings',
      sections: {
        preferences: 'Preferences',
        general: 'General',
        about: 'About',
      },
      settings: [
        { icon: Globe, title: 'Language', value: 'English', action: 'language' },
        { icon: Moon, title: 'Theme', value: 'Dark', action: 'theme' },
        { icon: Trash2, title: 'Clear Data', value: '', action: 'clear' },
        { icon: Info, title: 'About', value: 'Version 1.0.0', action: 'about' },
        { icon: LogOut, title: 'Logout', value: '', action: 'logout' },
      ],
    },
  };

  const t = content[language];
  const isRTL = language === 'ar';

  const handleAction = (action: string) => {
    if (action === 'language') {
      onLanguageChange?.(language === 'ar' ? 'en' : 'ar');
    }
  };

  return (
    <div className="h-full overflow-y-auto luxury-scrollbar p-4">
      {/* Header */}
      <div className="mb-6 animate-in fade-in-0 slide-in-from-top-2 duration-500">
        <h1 className="text-3xl font-bold text-holographic mb-2">{t.title}</h1>
      </div>

      {/* Settings list */}
      <div className="space-y-3 animate-in fade-in-0 slide-in-from-bottom-2 duration-500 delay-100">
        {t.settings.map((setting, index) => {
          const Icon = setting.icon;
          const isDestructive = setting.action === 'logout' || setting.action === 'clear';

          return (
            <Card3D
              key={index}
              variant="glass"
              interactive
              className={cn(
                'cursor-pointer animate-in fade-in-0 slide-in-from-bottom-2',
                isDestructive && 'border-red-500/30'
              )}
              style={{ animationDelay: `${index * 100}ms` }}
              onClick={() => handleAction(setting.action)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center',
                    'bg-white/10 backdrop-blur-md border border-white/20',
                    isDestructive && 'bg-red-500/20 border-red-500/30'
                  )}>
                    <Icon className={cn(
                      'h-5 w-5',
                      isDestructive ? 'text-red-400' : 'text-white'
                    )} />
                  </div>
                  
                  <div>
                    <h3 className={cn(
                      'font-medium',
                      isDestructive ? 'text-red-400' : 'text-white'
                    )}>
                      {setting.title}
                    </h3>
                    {setting.value && (
                      <p className="text-sm text-white/60">{setting.value}</p>
                    )}
                  </div>
                </div>

                <ChevronRight className={cn(
                  'h-5 w-5 text-white/40 transition-transform',
                  isRTL && 'rotate-180'
                )} />
              </div>
            </Card3D>
          );
        })}
      </div>

      {/* Footer info */}
      <div className="mt-8 text-center text-white/40 text-sm animate-in fade-in-0 duration-500 delay-500">
        <p>Made with ❤️ for better meetings</p>
      </div>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
