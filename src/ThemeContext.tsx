import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors as lightColors, darkColors } from './theme';

type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  colors: typeof lightColors | typeof darkColors;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  colors: lightColors,
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');

  useEffect(() => {
    AsyncStorage.getItem('@tijori_theme').then(saved => {
      if (saved === 'dark') {
        setThemeState('dark');
      }
    });
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    AsyncStorage.setItem('@tijori_theme', newTheme);
  };

  const colors = theme === 'dark' ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ theme, colors, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
