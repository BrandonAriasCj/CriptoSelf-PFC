import { useEffect, useState } from 'react';
import { useTheme } from '../components/theme/ThemeProvider';

export const useCurrentTheme = () => {
  const { theme } = useTheme();
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      setCurrentTheme(mediaQuery.matches ? 'dark' : 'light');

      const handleChange = (e: MediaQueryListEvent) => {
        setCurrentTheme(e.matches ? 'dark' : 'light');
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      setCurrentTheme(theme as 'light' | 'dark');
    }
  }, [theme]);

  return {
    currentTheme,
    isDark: currentTheme === 'dark',
    isLight: currentTheme === 'light',
  };
};