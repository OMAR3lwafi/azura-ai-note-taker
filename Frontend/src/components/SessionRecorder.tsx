import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Pause, Play, Square, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { Button } from './ui/button';
import { GlassCard, GlassCardContent } from './ui/glass-card';
import { Loader } from './ui/loader';
import { Alert, AlertDescription } from './ui/alert';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { t, type Language } from '../lib/i18n';

interface Segment {
  id: string;
  speaker_label: string;
  text: string;
  start_ms: number;
  end_ms: number;
  is_final: boolean;
}

interface SessionRecorderProps {
  language: Language;
  onSessionSaved?: (meetingId: string) => void;
}

export default function SessionRecorder({ language, onSessionSaved }: SessionRecorderProps) {
  const { session } = useAuth();
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [meetingId, setMeetingId] = useState<string | null>(null);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [currentInterimText, setCurrentInterimText] = useState('');
  const [micPermission, setMicPermission] = useState<PermissionState>('prompt');
  const [isConnected, setIsConnected] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // Check microphone permission
  useEffect(() => {
    navigator.permissions?.query({ name: 'microphone' as PermissionName })
      .then((result) => {
        setMicPermission(result.state);
        result.addEventListener('change', () => {
          setMicPermission(result.state);
        });
      })
      .catch(() => {
        // Fallback for browsers that don't support permissions API
        setMicPermission('prompt');
      });
  }, []);

  // Auto-scroll to latest transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [segments, currentInterimText]);

  // Request microphone permission
  const requestMicPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setMicPermission('granted');
      return true;
    } catch (err) {
      setMicPermission('denied');
      setError(t(language, 'session.micPermission'));
      return false;
    }
  };

  // Start recording session
  const startRecording = async () => {
    if (micPermission !== 'granted') {
      const granted = await requestMicPermission();
      if (!granted) return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Create meeting
      const { data: meeting, error: meetingError } = await supabase
        .from('meetings')
        .insert({
          owner_id: session?.user.id,
          title: `Meeting ${new Date().toLocaleString()}`,
          language: language,
          is_offline: !isConnected,
        })
        .select()
        .single();

      if (meetingError) throw meetingError;
      setMeetingId(meeting.id);

      // Get STT token
      const tokenResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/api/v1/token/stt`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!tokenResponse.ok) throw new Error('Failed to get STT token');
      const { token } = await tokenResponse.json();

      // Setup audio capture
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        },
      });

      // Initialize audio context
      audioContextRef.current = new AudioContext({ sampleRate: 16000 });
      const source = audioContextRef.current.createMediaStreamSource(stream);
      const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1);

      // Connect WebSocket for STT
      const wsUrl = `${import.meta.env.VITE_STT_WS_URL || 'wss://api.deepgram.com/v1/listen'}?encoding=linear16&sample_rate=16000&language=${language === 'ar' ? 'ar' : 'en'}&punctuate=true&diarize=true&interim_results=true`;
      
      socketRef.current = new WebSocket(wsUrl, {
        headers: {
          'Authorization': `Token ${token}`,
        },
      } as any);

      socketRef.current.onopen = () => {
        console.log('STT WebSocket connected');
        setIsConnected(true);
      };

      socketRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleTranscriptionResult(data);
      };

      socketRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setError('Connection error. Please check your internet.');
        setIsConnected(false);
      };

      socketRef.current.onclose = () => {
        setIsConnected(false);
      };

      // Process audio and send to WebSocket
      processor.onaudioprocess = (e) => {
        if (!isPaused && socketRef.current?.readyState === WebSocket.OPEN) {
          const inputData = e.inputBuffer.getChannelData(0);
          const pcm16 = convertFloat32ToInt16(inputData);
          socketRef.current.send(pcm16);
        }
      };

      source.connect(processor);
      processor.connect(audioContextRef.current.destination);

      // Setup media recorder for offline backup
      mediaRecorderRef.current = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        if (!isConnected && chunks.length > 0) {
          // Store offline audio for later processing
          const blob = new Blob(chunks, { type: 'audio/webm' });
          await uploadOfflineAudio(blob, meeting.id);
        }
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setIsLoading(false);
    } catch (err) {
      console.error('Failed to start recording:', err);
      setError('Failed to start recording. Please try again.');
      setIsLoading(false);
    }
  };

  // Handle transcription results from STT
  const handleTranscriptionResult = useCallback((data: any) => {
    if (!meetingId) return;

    const { is_final, channel } = data;
    const alternatives = channel?.alternatives || [];
    
    if (alternatives.length === 0) return;

    const transcript = alternatives[0].transcript;
    const words = alternatives[0].words || [];

    if (is_final) {
      // Final result - save to database
      const newSegments: Segment[] = words.map((word: any) => ({
        id: crypto.randomUUID(),
        speaker_label: word.speaker ? `SPEAKER_${word.speaker}` : 'SPEAKER_1',
        text: word.punctuated_word || word.word,
        start_ms: Math.round(word.start * 1000),
        end_ms: Math.round(word.end * 1000),
        is_final: true,
      }));

      setSegments(prev => [...prev, ...newSegments]);
      setCurrentInterimText('');

      // Batch save to backend
      savesegmentsBatch(newSegments);
    } else {
      // Interim result - show in UI
      setCurrentInterimText(transcript);
    }
  }, [meetingId]);

  // Save segments to database
  const savesegmentsBatch = async (newSegments: Segment[]) => {
    if (!meetingId || newSegments.length === 0) return;

    try {
      await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/api/v1/segments/batch`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            meetingId,
            segments: newSegments.map(s => ({
              speaker_label: s.speaker_label,
              start_ms: s.start_ms,
              end_ms: s.end_ms,
              text: s.text,
              lang: language,
            })),
          }),
        }
      );
    } catch (err) {
      console.error('Failed to save segments:', err);
    }
  };

  // Stop recording
  const stopRecording = async () => {
    setIsLoading(true);

    // Stop all recording
    mediaRecorderRef.current?.stop();
    socketRef.current?.close();
    audioContextRef.current?.close();

    // End meeting
    if (meetingId) {
      try {
        await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/api/v1/meetings/${meetingId}/end`,
          {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${session?.access_token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        onSessionSaved?.(meetingId);
      } catch (err) {
        console.error('Failed to end meeting:', err);
      }
    }

    setIsRecording(false);
    setIsPaused(false);
    setIsLoading(false);
  };

  // Toggle pause
  const togglePause = () => {
    setIsPaused(!isPaused);
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.pause();
    } else if (mediaRecorderRef.current?.state === 'paused') {
      mediaRecorderRef.current.resume();
    }
  };

  // Upload offline audio for later processing
  const uploadOfflineAudio = async (blob: Blob, meetingId: string) => {
    const fileName = `${meetingId}/audio_${Date.now()}.webm`;
    const { error } = await supabase.storage
      .from('audio')
      .upload(fileName, blob);

    if (error) {
      console.error('Failed to upload offline audio:', error);
    }
  };

  // Convert audio format for STT
  const convertFloat32ToInt16 = (buffer: Float32Array) => {
    const l = buffer.length;
    const buf = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      buf[i] = Math.min(1, buffer[i]) * 0x7FFF;
    }
    return buf.buffer;
  };

  // Group segments by speaker
  const groupedSegments = segments.reduce((acc, segment) => {
    const lastGroup = acc[acc.length - 1];
    if (lastGroup && lastGroup.speaker === segment.speaker_label) {
      lastGroup.segments.push(segment);
    } else {
      acc.push({
        speaker: segment.speaker_label,
        segments: [segment],
      });
    }
    return acc;
  }, [] as { speaker: string; segments: Segment[] }[]);

  return (
    <div className="h-full flex flex-col p-4 space-y-4">
      {/* Header */}
      <GlassCard variant="elevated" intensity="medium">
        <GlassCardContent className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {isConnected ? (
                <Wifi className="w-4 h-4 text-green-400" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-400" />
              )}
              <span className="text-sm text-white/70">
                {isConnected ? t(language, 'common.online') : t(language, 'common.offline')}
              </span>
            </div>
            {isRecording && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-sm text-white/70">
                  {isPaused ? t(language, 'session.paused') : t(language, 'session.recording')}
                </span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {!isRecording ? (
              <Button
                onClick={startRecording}
                disabled={isLoading}
                variant="default"
                size="lg"
                className="glass-surface"
              >
                {isLoading ? (
                  <Loader size="sm" />
                ) : (
                  <>
                    <Mic className="w-5 h-5 mr-2" />
                    {t(language, 'session.start')}
                  </>
                )}
              </Button>
            ) : (
              <>
                <Button
                  onClick={togglePause}
                  variant="outline"
                  size="icon"
                  className="glass-surface"
                >
                  {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                </Button>
                <Button
                  onClick={stopRecording}
                  variant="destructive"
                  size="icon"
                  className="glass-surface"
                >
                  <Square className="w-5 h-5" />
                </Button>
              </>
            )}
          </div>
        </GlassCardContent>
      </GlassCard>

      {/* Error message */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Transcript area */}
      <GlassCard variant="default" intensity="light" className="flex-1 overflow-hidden">
        <GlassCardContent className="h-full overflow-y-auto">
          {groupedSegments.length === 0 && !currentInterimText ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-white/50">{t(language, 'session.noContent')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {groupedSegments.map((group, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-primary">
                      {group.speaker}
                    </span>
                  </div>
                  <p className="text-white/90 leading-relaxed">
                    {group.segments.map(s => s.text).join(' ')}
                  </p>
                </div>
              ))}
              
              {currentInterimText && (
                <div className="space-y-1 opacity-60">
                  <span className="text-xs font-medium text-primary">
                    {segments.length > 0 ? segments[segments.length - 1].speaker_label : 'SPEAKER_1'}
                  </span>
                  <p className="text-white/70 leading-relaxed italic">
                    {currentInterimText}
                  </p>
                </div>
              )}
              
              <div ref={transcriptEndRef} />
            </div>
          )}
        </GlassCardContent>
      </GlassCard>
    </div>
  );
}