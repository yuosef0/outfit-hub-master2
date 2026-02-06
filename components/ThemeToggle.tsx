'use client';

import { useTheme } from './ThemeProvider';

export function ThemeToggle() {
 const { theme, toggleTheme } = useTheme();

 return (
 <button
 onClick={toggleTheme}
 className="flex items-center justify-center w-10 h-10 rounded-full bg-card-light border border-border-light text-text-light-primary hover:bg-card-light transition-all duration-200"
 aria-label="Toggle theme"
 >
 {theme === 'light' ? (
 <span className="material-symbols-outlined text-xl">dark_mode</span>
 ) : (
 <span className="material-symbols-outlined text-xl">light_mode</span>
 )}
 </button>
 );
}

// Alternative compact toggle for headers
export function ThemeToggleCompact() {
 const { theme, toggleTheme } = useTheme();

 return (
 <button
 onClick={toggleTheme}
 className="flex items-center justify-center rounded-full h-10 w-10 bg-transparent text-text-light-primary hover:bg-card-light transition-colors"
 aria-label="Toggle theme"
 >
 <span className="material-symbols-outlined text-2xl">
 {theme === 'light' ? 'dark_mode' : 'light_mode'}
 </span>
 </button>
 );
}

// Toggle with text labels
export function ThemeToggleWithLabel() {
 const { theme, toggleTheme } = useTheme();

 return (
 <button
 onClick={toggleTheme}
 className="flex items-center gap-2 px-4 h-10 rounded-lg bg-card-light border border-border-light text-text-light-primary hover:bg-card-light transition-all duration-200"
 aria-label="Toggle theme"
 >
 <span className="material-symbols-outlined text-xl">
 {theme === 'light' ? 'dark_mode' : 'light_mode'}
 </span>
 <span className="text-sm font-medium">
 {theme === 'light' ? 'Dark' : 'Light'}
 </span>
 </button>
 );
}

// Switch-style toggle
export function ThemeToggleSwitch() {
 const { theme, toggleTheme } = useTheme();

 return (
 <button
 onClick={toggleTheme}
 className="relative inline-flex h-8 w-14 items-center rounded-full bg-card-light transition-colors duration-200"
 aria-label="Toggle theme"
 >
 <span
 className={`inline-block h-6 w-6 transform rounded-full bg-card-light transition-transform duration-200 flex items-center justify-center ${
 theme === 'dark' ? 'translate-x-7' : 'translate-x-1'
 }`}
 >
 <span className="material-symbols-outlined text-sm text-text-light-secondary ">
 {theme === 'light' ? 'light_mode' : 'dark_mode'}
 </span>
 </span>
 </button>
 );
}
