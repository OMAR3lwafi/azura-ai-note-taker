import { useState } from 'react';
import { Search, Calendar, Users, Clock, Download, Share, Trash2, FileText } from 'lucide-react';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';

interface GalleryScreenProps {
  language: 'ar' | 'en';
}

interface MeetingNote {
  id: string;
  title: string;
  date: Date;
  duration: number;
  participants: number;
  summary: string;
  tags: string[];
  transcript: string;
}

export default function GalleryScreen({ language }: GalleryScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'recent' | 'important'>('all');

  const isRTL = language === 'ar';

  const text = {
    ar: {
      gallery: 'معرض الملاحظات',
      search: 'البحث في الملاحظات...',
      all: 'الكل',
      recent: 'حديث',
      important: 'مهم',
      noNotes: 'لا توجد ملاحظات محفوظة',
      noNotesDesc: 'ابدأ اجتماعك الأول لإنشاء ملاحظات',
      participants: 'مشاركين',
      minutes: 'دقيقة',
      share: 'مشاركة',
      download: 'تحميل',
      delete: 'حذف'
    },
    en: {
      gallery: 'Notes Gallery',
      search: 'Search notes...',
      all: 'All',
      recent: 'Recent',
      important: 'Important',
      noNotes: 'No saved notes',
      noNotesDesc: 'Start your first meeting to create notes',
      participants: 'participants',
      minutes: 'min',
      share: 'Share',
      download: 'Download',
      delete: 'Delete'
    }
  };

  const t = text[language];

  // Sample meeting notes
  const sampleNotes: MeetingNote[] = [
    {
      id: '1',
      title: language === 'ar' ? 'اجتماع تخطيط المشروع' : 'Project Planning Meeting',
      date: new Date(2024, 8, 28, 10, 0),
      duration: 45,
      participants: 5,
      summary: language === 'ar' 
        ? 'ناقش الفريق خطة المشروع الجديد وحدد المواعيد النهائية والمسؤوليات. تم الاتفاق على تقسيم العمل إلى ثلاث مراحل.'
        : 'Team discussed new project plan and set deadlines and responsibilities. Agreed to divide work into three phases.',
      tags: [language === 'ar' ? 'مشروع' : 'project', language === 'ar' ? 'تخطيط' : 'planning'],
      transcript: language === 'ar'
        ? 'مرحبا بكم في اجتماع اليوم. سنناقش خطة المشروع الجديد...'
        : 'Welcome to today\'s meeting. We\'ll discuss the new project plan...'
    },
    {
      id: '2',
      title: language === 'ar' ? 'مراجعة أسبوعية' : 'Weekly Review',
      date: new Date(2024, 8, 25, 14, 30),
      duration: 30,
      participants: 3,
      summary: language === 'ar'
        ? 'مراجعة التقدم الأسبوعي وحل المشاكل الحالية. تم تحديد أولويات الأسبوع القادم.'
        : 'Weekly progress review and current issues resolution. Next week priorities identified.',
      tags: [language === 'ar' ? 'مراجعة' : 'review', language === 'ar' ? 'أسبوعي' : 'weekly'],
      transcript: language === 'ar'
        ? 'دعونا نراجع ما أنجزناه هذا الأسبوع...'
        : 'Let\'s review what we accomplished this week...'
    }
  ];

  const filteredNotes = sampleNotes.filter(note => {
    const matchesSearch = searchQuery === '' || 
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.transcript.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter = selectedFilter === 'all' || 
      (selectedFilter === 'recent' && (Date.now() - note.date.getTime()) < 7 * 24 * 60 * 60 * 1000) ||
      (selectedFilter === 'important' && note.tags.includes(language === 'ar' ? 'مهم' : 'important'));

    return matchesSearch && matchesFilter;
  });

  const formatDate = (date: Date) => {
    return date.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filters = [
    { id: 'all' as const, label: t.all },
    { id: 'recent' as const, label: t.recent },
    { id: 'important' as const, label: t.important }
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 space-y-4">
        <h2 className="font-medium">{t.gallery}</h2>
        
        {/* Search */}
        <div className="relative">
          <Search className={`absolute top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground ${isRTL ? 'right-3' : 'left-3'}`} />
          <Input
            type="text"
            placeholder={t.search}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`${isRTL ? 'pr-10' : 'pl-10'}`}
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          {filters.map((filter) => (
            <Button
              key={filter.id}
              variant={selectedFilter === filter.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedFilter(filter.id)}
              className="flex-1"
            >
              {filter.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Notes List */}
      <div className="flex-1 px-4">
        <ScrollArea className="h-full">
          {filteredNotes.length === 0 ? (
            <div className="text-center py-16 space-y-4">
              <FileText className="h-16 w-16 text-muted-foreground/50 mx-auto" />
              <div>
                <h3 className="font-medium mb-2">{t.noNotes}</h3>
                <p className="text-sm text-muted-foreground">{t.noNotesDesc}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3 pb-4">
              {filteredNotes.map((note) => (
                <div key={note.id} className="border border-border rounded-lg p-4 space-y-3">
                  {/* Note Header */}
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <h3 className="font-medium line-clamp-1">{note.title}</h3>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Share className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Metadata */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(note.date)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{note.duration} {t.minutes}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span>{note.participants} {t.participants}</span>
                      </div>
                    </div>
                  </div>

                  {/* Summary */}
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {note.summary}
                  </p>

                  {/* Tags */}
                  {note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {note.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <FileText className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                      {language === 'ar' ? 'عرض' : 'View'}
                    </Button>
                    <Button variant="outline" size="sm">
                      {t.share}
                    </Button>
                    <Button variant="outline" size="sm">
                      {t.download}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}