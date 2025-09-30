import { useState, useEffect, useRef } from 'react';
import { Home, Mic, FileText, Settings, Sparkles, Zap } from 'lucide-react';
import { Toaster } from 'sonner@2.0.3';
import LuxuryHomeScreen from './components/luxury/HomeScreen';
import LuxurySessionScreen from './components/luxury/SessionScreen';
import LuxuryGalleryScreen from './components/luxury/GalleryScreen';
import LuxurySettingsScreen from './components/luxury/SettingsScreen';
import ModernHomeScreen from './components/modern/HomeScreen';
import ModernSessionScreen from './components/modern/SessionScreen';
import ModernGalleryScreen from './components/modern/GalleryScreen';
import ModernSettingsScreen from './components/modern/SettingsScreen';

type Tab = 'home' | 'session' | 'gallery' | 'settings';
type Language = 'ar' | 'en';
type Theme = 'luxury' | 'modern';

const THEME_STORAGE_KEY = 'azora-theme-preference';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [language, setLanguage] = useState<Language>('ar');
  const [theme, setTheme] = useState<Theme>(() => {
    // Hydrate theme from localStorage on load
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return (stored === 'luxury' || stored === 'modern') ? stored : 'modern';
  });
  const videoRef = useRef<HTMLVideoElement>(null);

  // Persist theme to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'modern' ? 'luxury' : 'modern');
  };

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      // Force complete muting - multiple approaches
      const forceMute = () => {
        video.muted = true;
        video.volume = 0;
        // Additional HTML5 audio track management
        if (video.audioTracks) {
          for (let i = 0; i < video.audioTracks.length; i++) {
            video.audioTracks[i].enabled = false;
          }
        }
      };
      
      // Apply muting immediately
      forceMute();
      
      // Ensure video plays and loops
      video.play().catch(() => {
        console.log('Autoplay prevented, will retry on user interaction');
      });
      
      // Handle video events to maintain muted state
      const handleVideoEnd = () => {
        video.currentTime = 0;
        forceMute();
        video.play();
      };
      
      const handlePlay = () => {
        forceMute();
      };
      
      const handleLoadedData = () => {
        forceMute();
      };
      
      const handleVolumeChange = () => {
        if (!video.muted || video.volume > 0) {
          forceMute();
        }
      };
      
      // Handle user interaction to start video if autoplay was blocked
      const handleUserInteraction = () => {
        if (video.paused) {
          forceMute();
          video.play().catch(() => console.log('Video play failed'));
        }
      };
      
      // Add all event listeners
      video.addEventListener('ended', handleVideoEnd);
      video.addEventListener('play', handlePlay);
      video.addEventListener('loadeddata', handleLoadedData);
      video.addEventListener('volumechange', handleVolumeChange);
      document.addEventListener('touchstart', handleUserInteraction, { once: true });
      document.addEventListener('click', handleUserInteraction, { once: true });
      
      // Periodic check to ensure muting (aggressive approach)
      const muteInterval = setInterval(forceMute, 1000);
      
      return () => {
        video.removeEventListener('ended', handleVideoEnd);
        video.removeEventListener('play', handlePlay);
        video.removeEventListener('loadeddata', handleLoadedData);
        video.removeEventListener('volumechange', handleVolumeChange);
        document.removeEventListener('touchstart', handleUserInteraction);
        document.removeEventListener('click', handleUserInteraction);
        clearInterval(muteInterval);
      };
    }
  }, []);

  const isRTL = language === 'ar';

  const tabs = [
    { id: 'home' as Tab, icon: Home, label: language === 'ar' ? 'الرئيسية' : 'Home' },
    { id: 'session' as Tab, icon: Mic, label: language === 'ar' ? 'جلسة' : 'Session' },
    { id: 'gallery' as Tab, icon: FileText, label: language === 'ar' ? 'المعرض' : 'Gallery' },
    { id: 'settings' as Tab, icon: Settings, label: language === 'ar' ? 'الإعدادات' : 'Settings' },
  ];

  const renderScreen = () => {
    const screens = theme === 'modern' ? {
      home: <ModernHomeScreen language={language} onStartSession={() => setActiveTab('session')} onNavigate={setActiveTab} />,
      session: <ModernSessionScreen language={language} onEndSession={() => setActiveTab('gallery')} />,
      gallery: <ModernGalleryScreen language={language} onNewSession={() => setActiveTab('session')} />,
      settings: <ModernSettingsScreen language={language} onLanguageChange={setLanguage} />,
    } : {
      home: <LuxuryHomeScreen language={language} onStartSession={() => setActiveTab('session')} />,
      session: <LuxurySessionScreen language={language} onSessionSaved={() => setActiveTab('gallery')} />,
      gallery: <LuxuryGalleryScreen language={language} />,
      settings: <LuxurySettingsScreen language={language} onLanguageChange={setLanguage} />,
    };

    return screens[activeTab] || screens.home;
  };

  return (
    <div 
      className={`${isRTL ? 'rtl' : 'ltr'}`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="size-full bg-background text-foreground relative overflow-hidden">
        {/* Background for outside mobile container */}
        <div className="fixed inset-0 bg-gradient-to-br from-black via-gray-900 to-black"></div>
        
        {/* Mobile Container */}
        <div className="max-w-sm mx-auto h-screen flex flex-col relative z-10 overflow-hidden">
          {/* Background Video for Mobile */}
          <div className="absolute inset-0 z-0">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              controls={false}
              disablePictureInPicture
              onLoadedData={() => {
                if (videoRef.current) {
                  videoRef.current.muted = true;
                  videoRef.current.volume = 0;
                }
              }}
              onPlay={() => {
                if (videoRef.current) {
                  videoRef.current.muted = true;
                  videoRef.current.volume = 0;
                }
              }}
              style={{ 
                width: '100%', 
                height: '100%',
                objectFit: 'cover'
              }}
            >
              <source src="https://res.cloudinary.com/doxbijxsx/video/upload/ybfttoqvciirodsnlpxi.mp4" type="video/mp4" />
              <source src="https://res.cloudinary.com/doxbijxsx/video/upload/ybfttoqvciirodsnlpxi.webm" type="video/webm" />
              {/* Fallback for browsers that don't support video */}
              <div className="w-full h-full bg-gradient-to-br from-black via-gray-900 to-black"></div>
            </video>
          </div>
          
          {/* Video Overlay for Luxury Effect */}
          <div className="absolute inset-0 z-10 bg-black/40"></div>
          
          {/* Background Mirror Effects */}
          <div className="absolute inset-0 z-20 bg-[radial-gradient(circle_at_20%_20%,rgba(30,58,138,0.15)_0%,transparent_50%)] animate-subtle-pulse"></div>
          <div className="absolute inset-0 z-20 bg-[radial-gradient(circle_at_80%_80%,rgba(30,58,138,0.08)_0%,transparent_50%)] animate-subtle-pulse" style={{ animationDelay: '1.5s' }}></div>
          
          {/* Glass Surface Overlay */}
          <div className="absolute inset-0 z-30 backdrop-blur-[1px] bg-gradient-to-br from-black/20 via-transparent to-black/30"></div>
          
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="absolute top-8 right-4 z-50 glass-surface rounded-full p-2 hover:bg-white/10 transition-all duration-300"
            aria-label={`Switch to ${theme === 'modern' ? 'luxury' : 'modern'} theme`}
            title={`Switch to ${theme === 'modern' ? 'luxury' : 'modern'} theme`}
          >
            {theme === 'modern' ? (
              <Sparkles className="h-5 w-5 text-primary" />
            ) : (
              <Zap className="h-5 w-5 text-primary" />
            )}
          </button>

          {/* Status Bar Simulation */}
          <div className="h-6 flex items-center justify-between px-4 text-xs silver-text relative z-40">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
            <span className="relative z-10">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            <div className="flex items-center gap-2 relative z-10">
              <div className="flex gap-1">
                <div className="w-1 h-1 bg-primary rounded-full animate-pulse"></div>
                <div className="w-1 h-1 bg-primary/70 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-1 h-1 bg-primary/40 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
              <div className="w-6 h-3 glass-surface rounded-sm relative overflow-hidden">
                <div className="w-4/5 h-full bg-gradient-to-r from-primary to-primary/60 rounded-sm relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-crystal-shimmer"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <main className="flex-1 overflow-hidden relative z-40">
            <div className="absolute inset-0 mirror-surface backdrop-blur-sm"></div>
            <div className="relative z-10 h-full">
              {/* App Title */}
              
              {/* Screen Content */}
              <div className="h-full overflow-hidden pb-24">
                {renderScreen()}
              </div>
            </div>
          </main>

          {/* Circular Navigation Buttons */}
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
            <div className="flex items-center gap-3 p-2 glass-surface rounded-full backdrop-blur-md">
              <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20 rounded-full"></div>
              {tabs.map((tab, index) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative w-12 h-12 rounded-full flex items-center justify-center elegant-transition group overflow-hidden ${
                      isActive 
                        ? 'bg-primary text-white crystal-glow' 
                        : 'glass-surface text-silver-medium hover:text-silver-light hover:bg-white/10'
                    }`}
                    style={{ 
                      animationDelay: `${index * 0.1}s`,
                      zIndex: isActive ? 20 : 10
                    }}
                  >
                    {isActive && (
                      <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/80 rounded-full"></div>
                    )}
                    {!isActive && (
                      <div className="absolute inset-0 mirror-surface rounded-full"></div>
                    )}
                    <div className="relative z-10">
                      <Icon className={`h-5 w-5 elegant-transition ${
                        isActive 
                          ? 'text-white drop-shadow-lg' 
                          : 'group-hover:scale-110'
                      }`} />
                    </div>
                    {isActive && (
                      <>
                        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-crystal-shimmer"></div>
                        <div className="absolute -inset-1 rounded-full border-2 border-primary/30 animate-glow-pulse"></div>
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </div>


        </div>

        {/* Toast Notifications */}
        <Toaster
          position={isRTL ? 'top-left' : 'top-right'}
          dir={isRTL ? 'rtl' : 'ltr'}
          theme="dark"
          toastOptions={{
            style: {
              background: 'var(--glass-background)',
              backdropFilter: 'blur(20px)',
              border: '1px solid var(--glass-border)',
              color: 'var(--silver-light)',
            },
          }}
        />
      </div>
    </div>
  );
}