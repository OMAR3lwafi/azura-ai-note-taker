import { useState } from 'react';
import { Button } from './ui/button';
import { useAuth } from '../hooks/useAuth';
import { Avatar, AvatarFallback } from './ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Home, FileText, Settings, LogOut, Mic } from 'lucide-react';
import { SessionEditor } from './session/SessionEditor';
import { GalleryList } from './gallery/GalleryList';
import { MeetingDetail } from './gallery/MeetingDetail';
import { ProfileScreen } from './auth/ProfileScreen';

type View = 'home' | 'session' | 'gallery' | 'detail' | 'settings';

export function MainLayout() {
  const { user, signOut } = useAuth();
  const [currentView, setCurrentView] = useState<View>('home');
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);

  const handleMeetingCreated = (meetingId: string) => {
    setSelectedMeetingId(meetingId);
  };

  const handleSelectMeeting = (meetingId: string) => {
    setSelectedMeetingId(meetingId);
    setCurrentView('detail');
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const getUserInitials = () => {
    if (user?.user_metadata?.display_name) {
      return user.user_metadata.display_name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return user?.email?.slice(0, 2).toUpperCase() || 'U';
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center px-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-xl">🎙️</span>
            </div>
            <span className="font-bold text-xl">Azora AI</span>
          </div>

          <nav className="flex items-center gap-1 mx-auto">
            <Button
              variant={currentView === 'home' ? 'default' : 'ghost'}
              onClick={() => setCurrentView('home')}
            >
              <Home className="h-4 w-4 mr-2" />
              Home
            </Button>
            <Button
              variant={currentView === 'session' ? 'default' : 'ghost'}
              onClick={() => setCurrentView('session')}
            >
              <Mic className="h-4 w-4 mr-2" />
              New Session
            </Button>
            <Button
              variant={currentView === 'gallery' ? 'default' : 'ghost'}
              onClick={() => setCurrentView('gallery')}
            >
              <FileText className="h-4 w-4 mr-2" />
              Gallery
            </Button>
          </nav>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar>
                  <AvatarFallback>{getUserInitials()}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <div className="px-2 py-1.5 text-sm">
                <div className="font-medium">{user?.user_metadata?.display_name || 'User'}</div>
                <div className="text-xs text-muted-foreground">{user?.email}</div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setCurrentView('settings')}>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {currentView === 'home' && (
          <div className="container h-full flex items-center justify-center">
            <div className="max-w-2xl text-center space-y-6">
              <h1 className="text-5xl font-bold">Welcome to Azora AI</h1>
              <p className="text-xl text-muted-foreground">
                Your intelligent meeting assistant with real-time transcription and AI insights
              </p>
              <div className="flex items-center justify-center gap-4">
                <Button size="lg" onClick={() => setCurrentView('session')}>
                  <Mic className="h-5 w-5 mr-2" />
                  Start New Session
                </Button>
                <Button size="lg" variant="outline" onClick={() => setCurrentView('gallery')}>
                  <FileText className="h-5 w-5 mr-2" />
                  View Gallery
                </Button>
              </div>
            </div>
          </div>
        )}

        {currentView === 'session' && (
          <SessionEditor
            onMeetingCreated={handleMeetingCreated}
            onMeetingEnded={() => setCurrentView('gallery')}
          />
        )}

        {currentView === 'gallery' && (
          <div className="container p-6">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-3xl font-bold mb-6">Your Meetings</h1>
              <GalleryList onSelectMeeting={handleSelectMeeting} />
            </div>
          </div>
        )}

        {currentView === 'detail' && selectedMeetingId && (
          <div className="container p-6">
            <div className="max-w-6xl mx-auto">
              <MeetingDetail
                meetingId={selectedMeetingId}
                onBack={() => setCurrentView('gallery')}
                onDelete={() => {
                  setCurrentView('gallery');
                  setSelectedMeetingId(null);
                }}
              />
            </div>
          </div>
        )}

        {currentView === 'settings' && <ProfileScreen />}
      </main>
    </div>
  );
}
