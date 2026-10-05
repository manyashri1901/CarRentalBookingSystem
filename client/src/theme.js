import { useCallback, useEffect, useState } from 'react';

const KEY = 'ecar-theme';

function readStored() {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

function initialTheme() {
  const stored = readStored();
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/** Light/dark theme stored in localStorage; defaults to the OS preference. */
export function useTheme() {
  const [theme, setTheme] = useState(initialTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(KEY, theme);
    } catch {
      /* storage unavailable (private mode) - theme still works for the session */
    }
  }, [theme]);

  const toggle = useCallback(() => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), []);
  return [theme, toggle];
}
