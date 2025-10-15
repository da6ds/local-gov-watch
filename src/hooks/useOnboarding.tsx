import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { isDevModeEnabled } from './useDevMode';

export function useOnboarding() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showWalkthrough, setShowWalkthrough] = useState(false);
  const location = useLocation();

  // Only show onboarding on landing page for new users
  useEffect(() => {
    // Skip onboarding entirely in dev mode
    if (isDevModeEnabled()) {
      sessionStorage.setItem('hasSeenOnboarding', 'true');
      return;
    }
    
    const hasSeenOnboarding = sessionStorage.getItem('hasSeenOnboarding');
    const isLandingPage = location.pathname === '/';
    
    if (!hasSeenOnboarding && isLandingPage) {
      const timer = setTimeout(() => setShowOnboarding(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [location.pathname]);

  // Only show walkthrough on dashboard after onboarding
  useEffect(() => {
    const hasSeenOnboarding = sessionStorage.getItem('hasSeenOnboarding');
    const hasSeenWalkthrough = sessionStorage.getItem('hasSeenWalkthrough');
    const isDashboard = location.pathname === '/dashboard';
    
    if (hasSeenOnboarding && !hasSeenWalkthrough && isDashboard) {
      const timer = setTimeout(() => setShowWalkthrough(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [location.pathname]);

  const completeOnboarding = () => {
    sessionStorage.setItem('hasSeenOnboarding', 'true');
    setShowOnboarding(false);
  };

  const skipOnboarding = () => {
    sessionStorage.setItem('hasSeenOnboarding', 'true');
    setShowOnboarding(false);
  };

  return {
    showOnboarding,
    setShowOnboarding,
    showWalkthrough,
    setShowWalkthrough,
    completeOnboarding,
    skipOnboarding,
  };
}
