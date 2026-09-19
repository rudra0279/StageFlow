/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        stage: {
          bg: '#0A0D14',
          card: '#121824',
          border: '#1E293B',
          hover: '#1B2436',
          sidebar: '#0E131F',
          header: '#0E131F',
        },
        brand: {
          primary: '#38BDF8',
          secondary: '#818CF8',
          accent: '#A78BFA',
        },
        live: {
          red: '#EF4444',
          green: '#10B981',
          amber: '#F59E0B',
          cyan: '#06B6D4',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-live': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(239, 68, 68, 0.4), 0 0 10px rgba(239, 68, 68, 0.2)' },
          '100%': { boxShadow: '0 0 15px rgba(239, 68, 68, 0.8), 0 0 25px rgba(239, 68, 68, 0.4)' },
        }
      }
    },
  },
  plugins: [],
};
