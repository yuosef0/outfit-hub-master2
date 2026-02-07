import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Outfit Hub Dark Theme - Logo-Inspired
        primary: "#2D5A43",           // Outfit Green - from logo
        "primary-light": "#3D7A5A",   // Lighter green for hovers
        "primary-dark": "#1F4030",    // Darker green for pressed states

        // Deep Forest Black backgrounds
        "background-light": "#0F1713",
        "background-dark": "#0F1713",

        // Text colors - Off-White with cool green tint
        "text-light-primary": "#E2E8E4",
        "text-light-secondary": "#8A9490",
        "text-dark-primary": "#E2E8E4",
        "text-dark-secondary": "#8A9490",

        // Charcoal Green - cards/panels
        "card-light": "#1A2420",
        "card-dark": "#1A2420",

        // Subtle green borders
        "border-light": "#2A3B34",
        "border-dark": "#2A3B34",

        // Elevated surfaces
        "surface-light": "#141C17",
        "surface-dark": "#141C17",

        // Accent colors
        "accent-green": "#2D5A43",
        "accent-gold": "#C5A377",     // Muted Gold - from logo icon
        "accent-glow": "#3D7A5A",

        // Cream colors for text
        "cream": "#F5E6D3",
        "cream-light": "#FFF3E6",
        "cream-dark": "#E8D5B7",
      },
      fontFamily: {
        display: ["Inter", "sans-serif"],
        playfair: ["var(--font-playfair)", "Playfair Display", "serif"],
      },
      borderRadius: {
        DEFAULT: "0.5rem",
        lg: "1rem",
        xl: "1.5rem",
        "2xl": "2rem",
        "3xl": "3rem",
        full: "9999px",
      },
      boxShadow: {
        'glow': '0 0 20px rgba(45, 90, 67, 0.25)',
        'glow-lg': '0 0 40px rgba(45, 90, 67, 0.3)',
        'glow-sm': '0 0 10px rgba(45, 90, 67, 0.15)',
        'card': '0 4px 24px rgba(0, 0, 0, 0.4)',
        'card-hover': '0 8px 32px rgba(0, 0, 0, 0.5), 0 0 20px rgba(45, 90, 67, 0.12)',
      },
      keyframes: {
        'slide-down': {
          '0%': { transform: 'translateX(-50%) translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(-50%) translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(45, 90, 67, 0.25)' },
          '50%': { boxShadow: '0 0 30px rgba(45, 90, 67, 0.4)' },
        },
      },
      animation: {
        'slide-down': 'slide-down 0.3s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
export default config;
