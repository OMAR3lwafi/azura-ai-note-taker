import { useState, useEffect, useCallback, useRef } from 'react';
import { sttApi } from '../lib/api';

interface STTSegment {
  id: number;
  speaker_label: string | null;
  text: string;
  start_ms: number;
  end_ms: number;
  is_final: boolean;
}

interface UseSTTOptions {
  onSegment?: (segment: STTSegment) => void;
  onError?: (error: Error) => void;
  language?: 'ar' | 'en';
}

export function useSTT({ onSegment, onError, language = 'ar' }: UseSTTOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const connect = useCallback(async () => {
    try {
      // Get STT token from backend
      const { data: tokenData, error: tokenError } = await sttApi.getToken();
      if (tokenError || !tokenData) {
        throw new Error('Failed to get STT token');
      }

      const token = tokenData.token;
      const wsUrl = tokenData.ws_url || 'wss://api.deepgram.com/v1/listen';

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Create WebSocket connection
      const ws = new WebSocket(
        `${wsUrl}?token=${token}&language=${language}&encoding=linear16&sample_rate=16000`
      );

      ws.onopen = () => {
        console.log('STT WebSocket connected');
        setIsConnected(true);
        setError(null);

        // Start recording and send audio
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'audio/webm',
        });

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0 && ws.readyState === WebSocket.OPEN) {
            ws.send(event.data);
          }
        };

        mediaRecorder.start(250); // Send chunks every 250ms
        mediaRecorderRef.current = mediaRecorder;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Handle different STT provider formats
          if (data.channel?.alternatives?.[0]) {
            // Deepgram format
            const transcript = data.channel.alternatives[0].transcript;
            const isFinal = data.is_final || data.speech_final;
            
            if (transcript) {
              const segment: STTSegment = {
                id: Date.now(),
                speaker_label: null, // Will be set by diarization
                text: transcript,
                start_ms: data.start * 1000 || Date.now(),
                end_ms: data.duration ? (data.start + data.duration) * 1000 : Date.now(),
                is_final: isFinal,
              };
              onSegment?.(segment);
            }
          }
        } catch (err) {
          console.error('Error parsing STT message:', err);
        }
      };

      ws.onerror = (event) => {
        console.error('STT WebSocket error:', event);
        const err = new Error('WebSocket connection error');
        setError(err);
        onError?.(err);
      };

      ws.onclose = () => {
        console.log('STT WebSocket disconnected');
        setIsConnected(false);
        cleanup();
      };

      wsRef.current = ws;
    } catch (err) {
      const error = err as Error;
      setError(error);
      onError?.(error);
    }
  }, [language, onSegment, onError]);

  const disconnect = useCallback(() => {
    cleanup();
  }, []);

  const cleanup = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.close();
    }

    wsRef.current = null;
    mediaRecorderRef.current = null;
    setIsConnected(false);
  };

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  return {
    connect,
    disconnect,
    isConnected,
    error,
  };
}
