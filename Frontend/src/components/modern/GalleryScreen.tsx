import * as React from 'react';
import { Search, Calendar, Tag, Plus } from 'lucide-react';
import { Card3D } from '../ui/card-3d';
import { Input3D } from '../ui/input-3d';
import { Button } from '../ui/button';

interface GalleryScreenProps {
  language: 'ar' | 'en';
  onSelectMeeting?: (id: string) => void;
  onNewSession?: () => void;
}

export default function GalleryScreen({ language, onNewSession }: GalleryScreenProps) {
  const [searchQuery, setSearchQuery] = React.useState('');

  const content = {
    ar: {
      title: 'المعرض',
      search: 'البحث في الجلسات...',
      newSession: 'جلسة جديدة',
      noSessions: 'لا توجد جلسات',
      startFirst: 'ابدأ أول جلسة لك',
      filters: ['الكل', 'اليوم', 'هذا الأسبوع', 'هذا الشهر'],
    },
    en: {
      title: 'Gallery',
      search: 'Search sessions...',
      newSession: 'New Session',
      noSessions: 'No sessions yet',
      startFirst: 'Start your first session',
      filters: ['All', 'Today', 'This Week', 'This Month'],
    },
  };

  const t = content[language];

  return (
    <div className="h-full flex flex-col p-4">
      {/* Header */}
      <div className="mb-6 animate-in fade-in-0 slide-in-from-top-2 duration-500">
        <h1 className="text-3xl font-bold text-holographic mb-4">{t.title}</h1>
        
        <Input3D
          variant="glass"
          placeholder={t.search}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftIcon={<Search className="h-4 w-4" />}
          clearable
          onClear={() => setSearchQuery('')}
        />
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 animate-in fade-in-0 slide-in-from-top-2 duration-500 delay-100">
        {t.filters.map((filter, index) => (
          <button
            key={index}
            className={cn(
              'px-4 py-2 rounded-full whitespace-nowrap',
              'text-sm font-medium transition-all duration-300',
              'hover:scale-105',
              index === 0
                ? 'bg-primary text-white shadow-[0_0_20px_var(--primary-glow)]'
                : 'bg-white/10 text-white/70 hover:bg-white/20 backdrop-blur-md border border-white/20'
            )}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Empty state */}
      <div className="flex-1 flex items-center justify-center animate-in fade-in-0 zoom-in-95 duration-500 delay-200">
        <Card3D variant="frosted" className="text-center py-16 max-w-sm">
          <div className="mb-6">
            <Calendar className="h-16 w-16 text-white/40 mx-auto animate-floating" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">{t.noSessions}</h2>
          <p className="text-white/60 mb-6">{t.startFirst}</p>
          <Button
            variant="gradient3d"
            onClick={onNewSession}
            className="mx-auto"
          >
            <Plus className="h-5 w-5" />
            {t.newSession}
          </Button>
        </Card3D>
      </div>

      {/* Floating action button */}
      <button
        onClick={onNewSession}
        className={cn(
          'fixed bottom-24 right-6 z-50',
          'w-14 h-14 rounded-full',
          'bg-gradient-to-br from-blue-500 to-blue-600',
          'shadow-[0_8px_32px_rgba(59,130,246,0.5)]',
          'flex items-center justify-center',
          'hover:scale-110 active:scale-95',
          'transition-all duration-300',
          'animate-floating'
        )}
      >
        <Plus className="h-6 w-6 text-white" />
      </button>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
