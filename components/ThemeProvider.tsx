'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
 theme: Theme;
 toggleTheme: () => void;
 setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
 const [theme, setThemeState] = useState<Theme>('dark');
 const [mounted, setMounted] = useState(false);

 useEffect(() => {
 setMounted(true);
 // Check localStorage for saved theme
 const savedTheme = localStorage.getItem('outfit-hub-theme') as Theme;

 if (savedTheme) {
 setThemeState(savedTheme);
 document.documentElement.classList.toggle('dark', savedTheme === 'dark');
 } else {
 // Default to dark mode for the luxury theme
 setThemeState('dark');
 document.documentElement.classList.toggle('dark', true);
 }
 }, []);

 const setTheme = (newTheme: Theme) => {
 setThemeState(newTheme);
 localStorage.setItem('outfit-hub-theme', newTheme);
 document.documentElement.classList.toggle('dark', newTheme === 'dark');
 };

 const toggleTheme = () => {
 const newTheme = theme === 'light' ? 'dark' : 'light';
 setTheme(newTheme);
 };

 // Prevent flash of unstyled content
 if (!mounted) {
 return null;
 }

 return (
 <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
 {children}
 </ThemeContext.Provider>
 );
}

export function useTheme() {
 const context = useContext(ThemeContext);
 if (context === undefined) {
 throw new Error('useTheme must be used within a ThemeProvider');
 }
 return context;
}
