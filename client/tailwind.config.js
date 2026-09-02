/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      colors: {
        studio: {
          bg: '#09090b',
          surface: '#18181b',
          elevated: '#27272a',
          border: '#3f3f46',
          muted: '#a1a1aa',
          fg: '#fafafa',
          accent: '#3b82f6',
          'accent-hover': '#2563eb',
          danger: '#ef4444',
          success: '#22c55e',
        },
      },
      boxShadow: {
        glow: '0 0 24px rgba(59, 130, 246, 0.25)',
      },
    },
  },
  plugins: [],
}
