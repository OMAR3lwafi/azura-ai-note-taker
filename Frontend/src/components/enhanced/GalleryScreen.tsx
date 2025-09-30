import { useState, useEffect } from 'react';
import { Search, Calendar, Users, Clock, Download, Share, Trash2, FileText, RefreshCw } from 'lucide-react';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

interface GalleryScreenProps {
  language: 'ar' | 'en';
}

interface MeetingNote {
  id: string;
  title: string;
  date: string;
  duration: number;
  participants: number;
  summary: string;
  tags: string[];
  transcript: string;
  language: 'ar' | 'en';
  created_at: string;
  updated_at: string;
}

export default function EnhancedGalleryScreen({ language }: GalleryScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'recent' | 'important'>('all');
  const [meetings, setMeetings] = useState<MeetingNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

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
      delete: 'حذف',
      view: 'عرض',
      exported: 'تم تصدير الملف',
      deleted: 'تم حذف الملاحظة',
      errorDeleting: 'خطأ في حذف الملاحظة',
      errorExporting: 'خطأ في تصدير الملف',
      refresh: 'تحديث',
      loading: 'جاري التحميل...'
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
      delete: 'Delete',
      view: 'View',
      exported: 'File exported successfully',
      deleted: 'Note deleted successfully',
      errorDeleting: 'Error deleting note',
      errorExporting: 'Error exporting file',
      refresh: 'Refresh',
      loading: 'Loading...'
    }
  };

  const t = text[language];

  // Load meetings from backend
  const loadMeetings = async () => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-779cc231/meetings`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });

      if (response.ok) {
        const { meetings: fetchedMeetings } = await response.json();
        setMeetings(fetchedMeetings || []);
      }
    } catch (error) {
      console.error('Error loading meetings:', error);
      // Load sample data as fallback
      setMeetings(getSampleNotes());
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadMeetings();
  }, []);

  // Refresh meetings
  const refreshMeetings = async () => {
    setIsRefreshing(true);
    await loadMeetings();
    setIsRefreshing(false);
  };

  // Sample meeting notes for fallback
  const getSampleNotes = (): MeetingNote[] => [
    {
      id: 'sample_1',
      title: language === 'ar' ? 'اجتماع تخطيط المشروع' : 'Project Planning Meeting',
      date: new Date(2024, 8, 28, 10, 0).toISOString(),
      duration: 45,
      participants: 5,
      summary: language === 'ar' 
        ? 'ناقش الفريق خطة المشروع الجديد وحدد المواعيد النهائية والمسؤوليات. تم الاتفاق على تقسيم العمل إلى ثلاث مراحل.'
        : 'Team discussed new project plan and set deadlines and responsibilities. Agreed to divide work into three phases.',
      tags: [language === 'ar' ? 'مشروع' : 'project', language === 'ar' ? 'تخطيط' : 'planning'],
      transcript: language === 'ar'
        ? 'مرحبا بكم في اجتماع اليوم. سنناقش خطة المشروع الجديد...'
        : 'Welcome to today\'s meeting. We\'ll discuss the new project plan...',
      language,
      created_at: new Date(2024, 8, 28, 10, 0).toISOString(),
      updated_at: new Date(2024, 8, 28, 10, 45).toISOString()
    }
  ];

  const filteredNotes = meetings.filter(note => {
    const matchesSearch = searchQuery === '' || 
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.transcript.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter = selectedFilter === 'all' || 
      (selectedFilter === 'recent' && (Date.now() - new Date(note.date).getTime()) < 7 * 24 * 60 * 60 * 1000) ||
      (selectedFilter === 'important' && note.tags.includes(language === 'ar' ? 'مهم' : 'important'));

    return matchesSearch && matchesFilter;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const exportMeeting = async (meeting: MeetingNote, format: 'text' | 'markdown' = 'text') => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-779cc231/export-meeting`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({
          meetingId: meeting.id,
          format
        })
      });

      if (response.ok) {
        const { exportData, filename } = await response.json();
        
        // Create and download file
        const blob = new Blob([exportData], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast.success(t.exported);
      } else {
        throw new Error('Export failed');
      }
    } catch (error) {
      console.error('Error exporting meeting:', error);
      toast.error(t.errorExporting);
    }
  };

  const deleteMeeting = async (meetingId: string) => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-779cc231/meetings/${meetingId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });

      if (response.ok) {
        setMeetings(prev => prev.filter(m => m.id !== meetingId));
        toast.success(t.deleted);
      } else {
        throw new Error('Delete failed');
      }
    } catch (error) {
      console.error('Error deleting meeting:', error);
      toast.error(t.errorDeleting);
    }
  };

  const shareText = (meeting: MeetingNote) => {
    const shareData = `${meeting.title}\n\n${meeting.summary}\n\n${formatDate(meeting.date)}`;
    
    if (navigator.share) {
      navigator.share({
        title: meeting.title,
        text: shareData,
      });
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(shareData);
      toast.success(language === 'ar' ? 'تم نسخ النص' : 'Text copied to clipboard');
    }
  };

  const filters = [
    { id: 'all' as const, label: t.all },
    { id: 'recent' as const, label: t.recent },
    { id: 'important' as const, label: t.important }
  ];

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-2">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">{t.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">{t.gallery}</h2>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={refreshMeetings}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        
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
                      <h3 className="font-medium line-clamp-1 flex-1">{note.title}</h3>
                      <div className="flex items-center gap-1 ml-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0"
                          onClick={() => shareText(note)}
                        >
                          <Share className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0"
                          onClick={() => exportMeeting(note, 'text')}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 text-destructive"
                          onClick={() => deleteMeeting(note.id)}
                        >
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
                    {note.summary || (language === 'ar' ? 'لا يوجد ملخص متاح' : 'No summary available')}
                  </p>

                  {/* Tags */}
                  {note.tags && note.tags.length > 0 && (
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
                      {t.view}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => shareText(note)}
                    >
                      {t.share}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => exportMeeting(note, 'markdown')}
                    >
                      MD
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