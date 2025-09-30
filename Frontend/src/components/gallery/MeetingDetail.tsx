import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { supabase } from '../../lib/supabase';
import { exportApi, meetingsApi } from '../../lib/api';
import {
  ArrowLeft,
  Download,
  Share2,
  Trash2,
  FileText,
  Users,
  Clock,
  Tag,
  Edit2,
  Check,
  X,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

interface MeetingDetailProps {
  meetingId: string;
  onBack?: () => void;
  onDelete?: () => void;
}

export function MeetingDetail({ meetingId, onBack, onDelete }: MeetingDetailProps) {
  const [meeting, setMeeting] = useState<any>(null);
  const [segments, setSegments] = useState<any[]>([]);
  const [speakers, setSpeakers] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTitle, setEditingTitle] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    loadMeetingData();
  }, [meetingId]);

  const loadMeetingData = async () => {
    setLoading(true);
    try {
      // Load meeting
      const { data: meetingData } = await supabase
        .from('meetings')
        .select('*')
        .eq('id', meetingId)
        .single();

      if (meetingData) {
        setMeeting(meetingData);
        setNewTitle(meetingData.title || '');
      }

      // Load segments
      const { data: segmentsData } = await supabase
        .from('segments')
        .select('*')
        .eq('meeting_id', meetingId)
        .order('start_ms', { ascending: true });

      if (segmentsData) {
        setSegments(segmentsData);
      }

      // Load speakers
      const { data: speakersData } = await supabase
        .from('speakers')
        .select('*')
        .eq('meeting_id', meetingId);

      if (speakersData) {
        setSpeakers(speakersData);
      }

      // Load tasks
      const { data: tasksData } = await supabase
        .from('tasks')
        .select('*')
        .eq('meeting_id', meetingId)
        .order('created_at', { ascending: false });

      if (tasksData) {
        setTasks(tasksData);
      }
    } catch (err) {
      toast.error('Failed to load meeting data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTitle = async () => {
    try {
      const { error } = await supabase
        .from('meetings')
        .update({ title: newTitle })
        .eq('id', meetingId);

      if (error) throw error;

      setMeeting({ ...meeting, title: newTitle });
      setEditingTitle(false);
      toast.success('Title updated');
    } catch (err) {
      toast.error('Failed to update title');
    }
  };

  const handleExport = async (format: 'markdown' | 'txt' | 'html') => {
    setExportLoading(true);
    try {
      const { data, error } = await exportApi.generate(meetingId, format);
      if (error) throw error;

      if (data?.id) {
        const { data: urlData } = await exportApi.getSignedUrl(data.id);
        if (urlData?.signed_url) {
          window.open(urlData.signed_url, '_blank');
          toast.success('Export ready');
        }
      }
    } catch (err) {
      toast.error('Failed to export meeting');
    } finally {
      setExportLoading(false);
    }
  };

  const formatDuration = (start: string, end: string | null): string => {
    if (!end) return 'In progress';
    const durationMs = new Date(end).getTime() - new Date(start).getTime();
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!meeting) {
    return (
      <Card className="p-8">
        <div className="text-center">
          <p className="text-muted-foreground">Meeting not found</p>
          <Button variant="outline" onClick={onBack} className="mt-4">
            Go Back
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          {editingTitle ? (
            <div className="flex items-center gap-2">
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="text-2xl font-bold"
                autoFocus
              />
              <Button size="sm" onClick={handleSaveTitle}>
                <Check className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setEditingTitle(false);
                  setNewTitle(meeting.title || '');
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold">
                {meeting.title || 'Untitled Meeting'}
              </h1>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingTitle(true)}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            </div>
          )}

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {new Date(meeting.started_at).toLocaleString()}
            </span>
            <span>•</span>
            <span>{formatDuration(meeting.started_at, meeting.ended_at)}</span>
            <Badge variant={meeting.language === 'ar' ? 'default' : 'secondary'}>
              {meeting.language === 'ar' ? 'Arabic' : 'English'}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => handleExport('markdown')}
            disabled={exportLoading}
          >
            {exportLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Export
          </Button>
          <Button variant="outline">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button variant="destructive" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Separator />

      {/* Content Tabs */}
      <Tabs defaultValue="transcript" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="transcript">
            <FileText className="h-4 w-4 mr-2" />
            Transcript
          </TabsTrigger>
          <TabsTrigger value="speakers">
            <Users className="h-4 w-4 mr-2" />
            Speakers ({speakers.length})
          </TabsTrigger>
          <TabsTrigger value="tasks">
            <Tag className="h-4 w-4 mr-2" />
            Tasks ({tasks.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="transcript" className="mt-4">
          <Card>
            <ScrollArea className="h-[600px] p-6">
              <div className="space-y-4">
                {segments.map((segment, index) => {
                  const speaker = speakers.find(
                    (s) => s.label === segment.speaker_label
                  );
                  return (
                    <div key={segment.id} className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <Badge variant="outline">
                          {speaker?.display_name || segment.speaker_label || 'Unknown'}
                        </Badge>
                        <span className="text-muted-foreground">
                          {Math.floor(segment.start_ms / 60000)}:
                          {Math.floor((segment.start_ms % 60000) / 1000)
                            .toString()
                            .padStart(2, '0')}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed pl-4">{segment.text}</p>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </Card>
        </TabsContent>

        <TabsContent value="speakers" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {speakers.map((speaker) => {
                  const speakerSegments = segments.filter(
                    (s) => s.speaker_label === speaker.label
                  );
                  const totalTime = speakerSegments.reduce(
                    (sum, s) => sum + (s.end_ms - s.start_ms),
                    0
                  );
                  const minutes = Math.floor(totalTime / 60000);

                  return (
                    <div key={speaker.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-semibold">
                          {speaker.display_name || speaker.label}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {speakerSegments.length} segments • {minutes} minutes
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-start gap-3 p-4 border rounded-lg"
                  >
                    <input
                      type="checkbox"
                      checked={task.status === 'done'}
                      className="mt-1"
                      readOnly
                    />
                    <div className="flex-1">
                      <p
                        className={`font-medium ${
                          task.status === 'done'
                            ? 'line-through text-muted-foreground'
                            : ''
                        }`}
                      >
                        {task.title}
                      </p>
                      {task.assignee && (
                        <p className="text-sm text-muted-foreground">
                          Assigned to: {task.assignee}
                        </p>
                      )}
                      {task.due_date && (
                        <p className="text-sm text-muted-foreground">
                          Due: {new Date(task.due_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
