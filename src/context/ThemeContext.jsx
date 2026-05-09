import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import api from '../services/api';

const ThemeContext = createContext();

const DEFAULT_THEME = {
  brand: '13 148 136',
  brandLight: '45 212 191',
  brandDark: '15 118 110',
  wellness: '16 185 129',
  wellnessLight: '52 211 153',
  wellnessDark: '5 150 105',
  accent: '250 204 21',
  ink: '17 24 39',
  inkMuted: '100 116 139',
  surface: '255 255 255',
  surfaceAlt: '248 250 252',
};

const THEME_VAR_MAP = {
  brand: '--brand',
  brandLight: '--brand-light',
  brandDark: '--brand-dark',
  wellness: '--wellness',
  wellnessLight: '--wellness-light',
  wellnessDark: '--wellness-dark',
  accent: '--accent',
  ink: '--ink',
  inkMuted: '--ink-muted',
  surface: '--surface',
  surfaceAlt: '--surface-alt',
};

const applyTheme = (theme) => {
  const root = document.documentElement;
  Object.entries(theme).forEach(([key, value]) => {
    const cssVar = THEME_VAR_MAP[key];
    if (cssVar) root.style.setProperty(cssVar, value);
  });
};

// Bump this whenever the DEFAULT_THEME shape/values change so old cached
// themes in users' browsers don't override the new defaults.
const THEME_VERSION = 'v2-green';
const STORAGE_KEY = 'site_theme';
const VERSION_KEY = 'site_theme_version';

const readCachedTheme = () => {
  try {
    const cachedVersion = localStorage.getItem(VERSION_KEY);
    if (cachedVersion !== THEME_VERSION) {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.setItem(VERSION_KEY, THEME_VERSION);
      return DEFAULT_THEME;
    }
    const cached = localStorage.getItem(STORAGE_KEY);
    return cached ? { ...DEFAULT_THEME, ...JSON.parse(cached) } : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
};

// Apply once at module load so the first paint is already themed (no flash
// of the hard-coded defaults).
applyTheme(readCachedTheme());

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(readCachedTheme);
  const lastSavedRef = useRef(JSON.stringify(theme));

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Pull the canonical theme from the API on mount AND whenever the tab
  // regains focus. This keeps the public site in sync with theme changes
  // that admin made in another tab.
  useEffect(() => {
    let cancelled = false;

    const fetchTheme = async () => {
      try {
        const res = await api.get('/theme');
        if (cancelled) return;
        const fetched = res.data?.data?.theme;
        if (!fetched) return;
        const next = { ...DEFAULT_THEME, ...fetched };
        const serialized = JSON.stringify(next);
        if (serialized === lastSavedRef.current) return;
        lastSavedRef.current = serialized;
        setTheme(next);
        localStorage.setItem(STORAGE_KEY, serialized);
      } catch {
        /* endpoint not ready / offline — keep cached theme */
      }
    };

    fetchTheme();
    window.addEventListener('focus', fetchTheme);
    return () => {
      cancelled = true;
      window.removeEventListener('focus', fetchTheme);
    };
  }, []);

  // Cross-tab sync: when admin saves in tab A, tab B picks it up.
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== STORAGE_KEY || !e.newValue) return;
      try {
        const next = { ...DEFAULT_THEME, ...JSON.parse(e.newValue) };
        lastSavedRef.current = e.newValue;
        setTheme(next);
      } catch { /* ignore */ }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const updateTheme = useCallback((partial) => {
    setTheme((prev) => {
      const next = { ...prev, ...partial };
      const s = JSON.stringify(next);
      lastSavedRef.current = s;
      localStorage.setItem(STORAGE_KEY, s);
      return next;
    });
  }, []);

  const replaceTheme = useCallback((next) => {
    const merged = { ...DEFAULT_THEME, ...next };
    const s = JSON.stringify(merged);
    lastSavedRef.current = s;
    setTheme(merged);
    localStorage.setItem(STORAGE_KEY, s);
  }, []);

  // Preview only — does not persist to localStorage. Used by admin theme editor.
  const previewTheme = useCallback((next) => {
    applyTheme({ ...DEFAULT_THEME, ...next });
  }, []);

  const resetTheme = useCallback(() => {
    const s = JSON.stringify(DEFAULT_THEME);
    lastSavedRef.current = s;
    setTheme(DEFAULT_THEME);
    localStorage.setItem(STORAGE_KEY, s);
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        updateTheme,
        replaceTheme,
        previewTheme,
        resetTheme,
        defaultTheme: DEFAULT_THEME,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};
