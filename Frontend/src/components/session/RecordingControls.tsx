import { useState } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Mic, MicOff, Pause, Play, Square, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

type RecordingStatus = 'idle' | 'recording' | 'paused' | 'stopped';

interface RecordingControlsProps {
  onStart: (language: 'ar' | 'en') => Promise<void>;
  onPause: () => void;
  onResume: () => void;
  onStop: () => Promise<void>;
  status?: RecordingStatus;
  duration?: number;
  language?: 'ar' | 'en';
}

export function RecordingControls({
  onStart,
  onPause,
  onResume,
  onStop,
  status = 'idle',
  duration = 0,
  language = 'ar',
}: RecordingControlsProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<'ar' | 'en'>(language);
  const [loading, setLoading] = useState(false);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = async () => {
    setLoading(true);
    try {
      await onStart(selectedLanguage);
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    setLoading(true);
    try {
      await onStop();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {status === 'recording' && (
            <>
              <div className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </div>
              <Badge variant="destructive">Recording</Badge>
            </>
          )}
          {status === 'paused' && (
            <>
              <Pause className="h-4 w-4 text-yellow-500" />
              <Badge variant="secondary">Paused</Badge>
            </>
          )}
          {status === 'stopped' && (
            <>
              <Square className="h-4 w-4 text-muted-foreground" />
              <Badge variant="outline">Stopped</Badge>
            </>
          )}
          {status === 'idle' && (
            <Badge variant="outline">Ready</Badge>
          )}
        </div>

        {(status === 'recording' || status === 'paused') && (
          <div className="text-2xl font-mono font-bold">
            {formatDuration(duration)}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {status === 'idle' && (
          <>
            <Select value={selectedLanguage} onValueChange={(v) => setSelectedLanguage(v as 'ar' | 'en')}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ar">العربية (Arabic)</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={handleStart} disabled={loading} className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <Mic className="mr-2 h-4 w-4" />
                  Start Recording
                </>
              )}
            </Button>
          </>
        )}

        {status === 'recording' && (
          <>
            <Button onClick={onPause} variant="secondary" size="lg">
              <Pause className="mr-2 h-4 w-4" />
              Pause
            </Button>
            <Button onClick={handleStop} variant="destructive" size="lg" disabled={loading}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Square className="mr-2 h-4 w-4" />
              )}
              Stop
            </Button>
          </>
        )}

        {status === 'paused' && (
          <>
            <Button onClick={onResume} variant="default" size="lg">
              <Play className="mr-2 h-4 w-4" />
              Resume
            </Button>
            <Button onClick={handleStop} variant="destructive" size="lg" disabled={loading}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Square className="mr-2 h-4 w-4" />
              )}
              Stop
            </Button>
          </>
        )}
      </div>

      {status === 'idle' && (
        <p className="text-sm text-muted-foreground">
          Select language and click "Start Recording" to begin. Make sure your microphone is connected.
        </p>
      )}
    </Card>
  );
}
