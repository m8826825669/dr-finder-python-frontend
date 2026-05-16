/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0e7490',
          50:  '#f0f9ff', 100: '#e0f2fe', 200: '#bae6fd',
          300: '#7dd3fc',  400: '#38bdf8', 500: '#0ea5e9',
          600: '#0284c7',  700: '#0369a1', 800: '#075985', 900: '#0c4a6e',
        },
        teal: {
          DEFAULT: '#0d9488',
          50:  '#f0fdfa', 100: '#ccfbf1', 200: '#99f6e4',
          500: '#14b8a6', 600: '#0d9488', 700: '#0f766e',
          800: '#115e59', 900: '#134e4a',
        },
        slate: {
          50:  '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0',
          300: '#cbd5e1', 400: '#94a3b8', 500: '#64748b',
          600: '#475569', 700: '#334155', 800: '#1e293b', 900: '#0f172a',
        },
      },
      fontFamily: {
        sans:    ['"DM Sans"', 'sans-serif'],
        display: ['"Playfair Display"', 'serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        'fade-in':    'fadeIn 0.4s ease forwards',
        'slide-up':   'slideUp 0.4s ease forwards',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
      },
      keyframes: {
        fadeIn:  { from: { opacity: '0' },                              to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
      boxShadow: {
        'card':    '0 1px 3px rgba(0,0,0,.08), 0 8px 24px rgba(14,116,144,.06)',
        'card-lg': '0 4px 6px rgba(0,0,0,.05), 0 16px 48px rgba(14,116,144,.10)',
        'btn':     '0 2px 8px rgba(14,116,144,.30)',
      },
    },
  },
  plugins: [],
}