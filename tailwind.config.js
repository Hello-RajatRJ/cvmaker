/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ["'Calibri'", "'Carlito'", "'Segoe UI'", 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        serif: ["'Calibri'", "'Carlito'", 'Georgia', 'serif'],
        mono: ["'Calibri'", "'Carlito'", 'ui-monospace', 'monospace'],
      },
      colors: {
        brand: {
          50: '#f7fee7',
          100: '#ecfccb',
          200: '#d9f99d',
          300: '#bef264',
          400: '#a3e635',
          500: '#84cc16', // Core Lime Green
          600: '#65a30d', // Deep Vibrant Lime
          700: '#4d7c0f',
          800: '#3f6212',
          900: '#1a2e05',
        },
        lime: {
          50: '#f7fee7',
          100: '#ecfccb',
          200: '#d9f99d',
          300: '#bef264',
          400: '#a3e635',
          500: '#84cc16',
          600: '#65a30d',
          700: '#4d7c0f',
          800: '#3f6212',
          900: '#1a2e05',
        },
        gold: {
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        }
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: 1, filter: 'drop-shadow(0 0 14px rgba(132, 204, 22, 0.65))' },
          '50%': { opacity: 0.7, filter: 'drop-shadow(0 0 5px rgba(132, 204, 22, 0.25))' },
        }
      }
    },
  },
  plugins: [],
}
