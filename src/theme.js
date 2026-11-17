import { useCallback, useEffect, useState } from 'react';

export const THEME_KEY = 'festeja:theme';

function getStoredTheme() {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    /* El modo también funciona con almacenamiento bloqueado. */
  }
  return null;
}

function getSystemTheme() {
  return typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-color-scheme: dark)')?.matches
    ? 'dark'
    : 'light';
}

export function getInitialTheme() {
  return getStoredTheme() ?? getSystemTheme();
}

export function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', theme === 'dark' ? '#131e19' : '#f7f4ed');
}

export function useTheme() {
  const [preference, setPreference] = useState(getStoredTheme);
  const [systemTheme, setSystemTheme] = useState(getSystemTheme);
  const theme = preference ?? systemTheme;
  const chooseTheme = useCallback((next) => {
    applyTheme(next);
    setPreference(next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      /* La elección se conserva en memoria durante esta sesión. */
    }
  }, []);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const followSystem = (event) => setSystemTheme(event.matches ? 'dark' : 'light');
    const syncTabs = (event) => {
      if (event.key === THEME_KEY || event.key === null) {
        setPreference(getStoredTheme());
        setSystemTheme(getSystemTheme());
      }
    };
    media.addEventListener('change', followSystem);
    window.addEventListener('storage', syncTabs);
    return () => {
      media.removeEventListener('change', followSystem);
      window.removeEventListener('storage', syncTabs);
    };
  }, []);

  return [theme, chooseTheme];
}
