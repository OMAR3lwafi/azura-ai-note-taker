import { useEffect, useRef } from 'react';
import { ScrollArea } from '../ui/scroll-area';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';

interface Segment {
  id: number;
  speaker_label: string | null;
  text: string;
  start_ms: number;
  end_ms: number;
  is_final: boolean;
}

interface TranscriptPaneProps {
  segments: Segment[];
  autoScroll?: boolean;
  highlightRecent?: boolean;
  speakerColors?: Record<string, string>;
}

const defaultColors = [
  'bg-blue-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-orange-500',
  'bg-pink-500',
  'bg-teal-500',
];

export function TranscriptPane({
  segments,
  autoScroll = true,
  highlightRecent = true,
  speakerColors = {},
}: TranscriptPaneProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new segments arrive
  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [segments, autoScroll]);

  const getSpeakerColor = (speaker: string | null, index: number): string => {
    if (!speaker) return 'bg-gray-500';
    if (speakerColors[speaker]) return speakerColors[speaker];
    return defaultColors[index % defaultColors.length];
  };

  const getSpeakerInitials = (speaker: string | null): string => {
    if (!speaker) return '?';
    const match = speaker.match(/\d+/);
    return match ? match[0] : speaker.substring(0, 2).toUpperCase();
  };

  const formatTimestamp = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Group segments by speaker for better visual flow
  const groupedSegments: Array<{ speaker: string | null; segments: Segment[] }> = [];
  let currentGroup: { speaker: string | null; segments: Segment[] } | null = null;

  segments.forEach((segment) => {
    if (!currentGroup || currentGroup.speaker !== segment.speaker_label) {
      currentGroup = { speaker: segment.speaker_label, segments: [segment] };
      groupedSegments.push(currentGroup);
    } else {
      currentGroup.segments.push(segment);
    }
  });

  if (segments.length === 0) {
    return (
      <Card className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-2">
          <p className="text-muted-foreground">No transcript yet</p>
          <p className="text-sm text-muted-foreground">
            Start recording to see live transcription here
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Transcript</h3>
          <Badge variant="secondary">{segments.length} segments</Badge>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-6">
          {groupedSegments.map((group, groupIndex) => {
            const speakerIndex = groupedSegments
              .slice(0, groupIndex + 1)
              .filter((g) => g.speaker === group.speaker).length - 1;

            return (
              <div key={groupIndex} className="flex gap-3">
                <Avatar className={`h-10 w-10 flex-shrink-0 ${getSpeakerColor(group.speaker, speakerIndex)}`}>
                  <AvatarFallback className="text-white font-semibold">
                    {getSpeakerInitials(group.speaker)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">
                      {group.speaker || 'Unknown Speaker'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatTimestamp(group.segments[0].start_ms)}
                    </span>
                  </div>

                  <div className="space-y-1">
                    {group.segments.map((segment, index) => (
                      <p
                        key={segment.id || `${groupIndex}-${index}`}
                        className={`text-sm leading-relaxed ${
                          !segment.is_final && highlightRecent
                            ? 'text-muted-foreground italic'
                            : 'text-foreground'
                        }`}
                      >
                        {segment.text}
                        {!segment.is_final && (
                          <span className="ml-1 inline-block w-1 h-4 bg-primary animate-pulse" />
                        )}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
    </Card>
  );
}
