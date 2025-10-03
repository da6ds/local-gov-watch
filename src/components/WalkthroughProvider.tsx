import { useState, useEffect } from 'react';
import Joyride, { CallBackProps, Step } from 'react-joyride';
import { useLocation } from 'react-router-dom';

const WALKTHROUGH_STEPS: Step[] = [
  {
    target: '[data-tour="dashboard"]',
    content: 'See all your government activity at a glance',
    disableBeacon: true,
    placement: 'bottom',
  },
  {
    target: '[data-tour="browse"]',
    content: 'Find legislation, meetings, and upcoming elections',
    placement: 'bottom',
  },
  {
    target: '[data-tour="alerts"]',
    content: 'Set up keyword monitoring and email notifications',
    placement: 'bottom',
  },
  {
    target: '[data-tour="my-workspace"]',
    content: 'Manage your tracked terms, stances, and followed items',
    placement: 'bottom',
  },
];

interface WalkthroughProviderProps {
  run: boolean;
  onComplete: () => void;
}

export function WalkthroughProvider({ run, onComplete }: WalkthroughProviderProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const location = useLocation();

  const handleCallback = (data: CallBackProps) => {
    const { action, index, type } = data;

    if (type === 'step:after' || action === 'next') {
      setStepIndex(index + 1);
    } else if (action === 'skip' || action === 'close' || type === 'tour:end') {
      sessionStorage.setItem('hasSeenWalkthrough', 'true');
      setStepIndex(0);
      onComplete();
    }
  };

  useEffect(() => {
    if (run) {
      setStepIndex(0);
    }
  }, [run]);

  // Only show on main pages
  const validPages = ['/', '/dashboard', '/alerts'];
  if (!validPages.includes(location.pathname)) {
    return null;
  }

  return (
    <Joyride
      steps={WALKTHROUGH_STEPS}
      run={run}
      stepIndex={stepIndex}
      callback={handleCallback}
      continuous
      showSkipButton
      showProgress
      styles={{
        options: {
          primaryColor: 'hsl(var(--primary))',
          backgroundColor: 'hsl(var(--background))',
          textColor: 'hsl(var(--foreground))',
          arrowColor: 'hsl(var(--background))',
          overlayColor: 'rgba(0, 0, 0, 0.4)',
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: 8,
          padding: 16,
        },
        buttonNext: {
          backgroundColor: 'hsl(var(--primary))',
          color: 'hsl(var(--primary-foreground))',
          borderRadius: 6,
          padding: '8px 16px',
        },
        buttonBack: {
          color: 'hsl(var(--muted-foreground))',
          marginRight: 8,
        },
        buttonSkip: {
          color: 'hsl(var(--muted-foreground))',
        },
      }}
      locale={{
        back: 'Back',
        close: 'Close',
        last: 'Finish',
        next: 'Next',
        skip: 'Skip tour',
      }}
    />
  );
}
