import { useState } from 'react';

export function useDemoMode() {
  const [demoMode, setDemoMode] = useState(false);

  return { demoMode, setDemoMode };
}
