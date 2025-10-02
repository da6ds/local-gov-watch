import { useState, useEffect } from 'react';

const DEMO_USER_KEY = 'demoUser';

export function useDemoUser() {
  const [demoUser, setDemoUser] = useState<string | null>(null);

  useEffect(() => {
    // Check sessionStorage on mount
    const storedUser = sessionStorage.getItem(DEMO_USER_KEY);
    setDemoUser(storedUser);
  }, []);

  const startDemo = (name: string) => {
    sessionStorage.setItem(DEMO_USER_KEY, name);
    setDemoUser(name);
  };

  const endDemo = () => {
    sessionStorage.clear();
    setDemoUser(null);
  };

  const isLoggedIn = !!demoUser;

  return {
    demoUser,
    isLoggedIn,
    startDemo,
    endDemo,
  };
}
