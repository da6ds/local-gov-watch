import { useState, useEffect } from 'react';

export function useOnboarding() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showWalkthrough, setShowWalkthrough] = useState(false);

  useEffect(() => {
    const hasSeenOnboarding = sessionStorage.getItem('hasSeenOnboarding');
    const hasLocation = sessionStorage.getItem('userLocation');
    const hasTrackedTerms = sessionStorage.getItem('trackedTerms');
    
    const isNewUser = !hasSeenOnboarding && !hasLocation && !hasTrackedTerms;
    
    if (isNewUser) {
      const timer = setTimeout(() => setShowOnboarding(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const completeOnboarding = () => {
    sessionStorage.setItem('hasSeenOnboarding', 'true');
    setShowOnboarding(false);
    setTimeout(() => setShowWalkthrough(true), 1000);
  };

  const skipOnboarding = () => {
    sessionStorage.setItem('hasSeenOnboarding', 'true');
    setShowOnboarding(false);
    setTimeout(() => setShowWalkthrough(true), 500);
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
