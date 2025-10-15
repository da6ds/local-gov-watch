import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const DEV_MODE_KEY = 'devMode';

export function useDevMode() {
  const [isDevMode, setIsDevMode] = useState(() => {
    // Check URL params first
    const searchParams = new URLSearchParams(window.location.search);
    const urlDevMode = searchParams.get('devMode');
    
    if (urlDevMode !== null) {
      const devModeEnabled = urlDevMode === 'true';
      localStorage.setItem(DEV_MODE_KEY, devModeEnabled.toString());
      return devModeEnabled;
    }
    
    // Otherwise check localStorage
    return localStorage.getItem(DEV_MODE_KEY) === 'true';
  });

  // Listen for Shift+D+M keyboard combo
  useEffect(() => {
    let waitingForM = false;
    let timeout: NodeJS.Timeout;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key.toLowerCase() === 'd') {
        waitingForM = true;
        
        timeout = setTimeout(() => {
          waitingForM = false;
        }, 500);
      } else if (waitingForM && e.key.toLowerCase() === 'm') {
        waitingForM = false;
        clearTimeout(timeout);
        toggleDevMode();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      clearTimeout(timeout);
    };
  }, []);

  const toggleDevMode = () => {
    const newDevMode = !isDevMode;
    localStorage.setItem(DEV_MODE_KEY, newDevMode.toString());
    setIsDevMode(newDevMode);
    
    toast(newDevMode ? '🔧 Dev Mode: ON' : '🔧 Dev Mode: OFF', {
      description: newDevMode 
        ? 'Onboarding skipped, Northern CA default location'
        : 'Onboarding enabled, Austin default location'
    });
    
    // Reload to apply changes
    setTimeout(() => window.location.reload(), 1000);
  };

  return { isDevMode, toggleDevMode };
}

export function isDevModeEnabled(): boolean {
  // Check URL params first
  const searchParams = new URLSearchParams(window.location.search);
  const urlDevMode = searchParams.get('devMode');
  
  if (urlDevMode !== null) {
    return urlDevMode === 'true';
  }
  
  return localStorage.getItem(DEV_MODE_KEY) === 'true';
}
