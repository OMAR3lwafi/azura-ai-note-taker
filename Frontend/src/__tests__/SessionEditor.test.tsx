import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SessionEditor } from '../components/session/SessionEditor';

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// Mock useAuth hook
const mockUser = { id: 'test-user-id', email: 'test@example.com' };
const mockSession = { access_token: 'test-token', user: mockUser };

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: mockUser,
    session: mockSession,
    loading: false,
    signInWithEmail: vi.fn(),
    signInWithOAuth: vi.fn(),
    signOut: vi.fn(),
    updateProfile: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock useSTT hook
const mockConnect = vi.fn();
const mockDisconnect = vi.fn();

vi.mock('../hooks/useSTT', () => ({
  useSTT: () => ({
    connect: mockConnect,
    disconnect: mockDisconnect,
    isConnected: false,
    error: null,
  }),
}));

// Mock Supabase client
vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: mockSession } }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  },
}));

// Mock API client
vi.mock('../lib/api', () => ({
  sttApi: {
    getToken: vi.fn().mockResolvedValue({ 
      data: { token: 'test-stt-token', ws_url: 'wss://test.example.com' },
      error: null 
    }),
  },
}));

// Mock navigator.mediaDevices
Object.defineProperty(global.navigator, 'mediaDevices', {
  value: {
    getUserMedia: vi.fn().mockResolvedValue({
      getTracks: () => [{ stop: vi.fn() }],
    }),
  },
  writable: true,
});

// Mock WebSocket
class MockWebSocket {
  readyState = WebSocket.CONNECTING;
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  
  constructor(public url: string) {
    setTimeout(() => {
      this.readyState = WebSocket.OPEN;
      this.onopen?.();
    }, 0);
  }
  
  send = vi.fn();
  close = vi.fn(() => {
    this.readyState = WebSocket.CLOSED;
    this.onclose?.();
  });
}

(global as any).WebSocket = MockWebSocket;

// Mock MediaRecorder
class MockMediaRecorder {
  state = 'inactive';
  ondataavailable: ((event: any) => void) | null = null;
  
  constructor(public stream: MediaStream, public options?: any) {}
  
  start = vi.fn(() => {
    this.state = 'recording';
  });
  
  stop = vi.fn(() => {
    this.state = 'inactive';
  });
}

(global as any).MediaRecorder = MockMediaRecorder;
(global as any).MediaRecorder.isTypeSupported = vi.fn(() => true);

describe('SessionEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render recording controls', () => {
    render(<SessionEditor />);
    expect(screen.getByText(/start recording/i)).toBeInTheDocument();
  });

  it('should start recording when button clicked', async () => {
    render(<SessionEditor />);

    const startButton = screen.getByText(/start recording/i);
    fireEvent.click(startButton);

    await waitFor(() => {
      expect(mockConnect).toHaveBeenCalled();
    });
  });

  it('should display transcript pane', () => {
    render(<SessionEditor />);
    expect(screen.getByTestId('transcript-pane')).toBeInTheDocument();
  });

  it('should show insights panel', () => {
    render(<SessionEditor />);
    expect(screen.getByTestId('insights-panel')).toBeInTheDocument();
  });

  it('should handle stop recording', async () => {
    render(<SessionEditor />);

    // Start recording first
    const startButton = screen.getByText(/start recording/i);
    fireEvent.click(startButton);

    await waitFor(() => {
      expect(mockConnect).toHaveBeenCalled();
    });

    // Stop recording
    const stopButton = screen.getByText(/stop/i);
    fireEvent.click(stopButton);

    await waitFor(() => {
      expect(mockDisconnect).toHaveBeenCalled();
    });
  });
});
