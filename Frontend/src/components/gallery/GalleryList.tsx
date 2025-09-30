import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { meetingsApi } from '../../lib/api';
import { Search, Calendar, Clock, Tag, Loader2, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface Meeting {
  id: string;
  title: string | null;
  started_at: string;
  ended_at: string | null;
  language: 'ar' | 'en';
  tags: string[];
  project: string | null;
}

interface GalleryListProps {
  onSelectMeeting?: (meetingId: string) => void;
}

export function GalleryList({ onSelectMeeting }: GalleryListProps) {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const loadMeetings = async (reset = false) => {
    setLoading(true);
    try {
      const offset = reset ? 0 : page * 20;
      const { data, error } = await meetingsApi.list({
        limit: 20,
        offset,
      });

      if (error) throw error;

      if (data) {
        if (reset) {
          setMeetings(data);
          setPage(0);
        } else {
          setMeetings((prev) => [...prev, ...data]);
        }
        setHasMore(data.length === 20);
      }
    } catch (err) {
      toast.error('Failed to load meetings', {
        description: (err as Error).message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMeetings(true);
  }, []);

  const handleLoadMore = () => {
    setPage((prev) => prev + 1);
    loadMeetings(false);
  };

  const formatDuration = (start: string, end: string | null): string => {
    if (!end) return 'In progress';
    const durationMs = new Date(end).getTime() - new Date(start).getTime();
    const minutes = Math.floor(durationMs / 60000);
    return `${minutes} min`;
  };

  const filteredMeetings = meetings.filter((meeting) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      meeting.title?.toLowerCase().includes(query) ||
      meeting.tags.some((tag) => tag.toLowerCase().includes(query)) ||
      meeting.project?.toLowerCase().includes(query)
    );
  });

  if (loading && meetings.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search meetings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {filteredMeetings.length === 0 ? (
        <Card className="p-12">
          <div className="text-center space-y-2">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
            <h3 className="font-semibold">No meetings found</h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery ? 'Try a different search term' : 'Start recording to create your first meeting'}
            </p>
          </div>
        </Card>
      ) : (
        <ScrollArea className="h-[calc(100vh-12rem)]">
          <div className="space-y-3">
            {filteredMeetings.map((meeting) => (
              <Card
                key={meeting.id}
                className="cursor-pointer hover:bg-accent transition-colors"
                onClick={() => onSelectMeeting?.(meeting.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold line-clamp-1">
                      {meeting.title || 'Untitled Meeting'}
                    </h3>
                    <Badge variant={meeting.language === 'ar' ? 'default' : 'secondary'}>
                      {meeting.language === 'ar' ? 'AR' : 'EN'}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-2">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(meeting.started_at).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDuration(meeting.started_at, meeting.ended_at)}
                    </span>
                  </div>

                  {(meeting.tags.length > 0 || meeting.project) && (
                    <div className="flex items-center gap-2 flex-wrap">
                      {meeting.project && (
                        <Badge variant="outline" className="text-xs">
                          {meeting.project}
                        </Badge>
                      )}
                      {meeting.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          <Tag className="h-2 w-2 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                      {meeting.tags.length > 3 && (
                        <span className="text-xs text-muted-foreground">
                          +{meeting.tags.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {hasMore && !loading && (
              <Button
                variant="outline"
                className="w-full"
                onClick={handleLoadMore}
              >
                Load More
              </Button>
            )}

            {loading && meetings.length > 0 && (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            )}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
