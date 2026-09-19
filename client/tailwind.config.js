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
          950: '#05070e',
          900: '#0a0d1a',
          850: '#0f1424',
          800: '#151b30',
          700: '#222b4c',
          600: '#344373',
          500: '#4e64ab'
        },
        accent: {
          cyan: '#06b6d4',
          violet: '#8b5cf6',
          amber: '#f59e0b',
          emerald: '#10b981',
          rose: '#f43f5e'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        prompter: ['Outfit', 'Inter', 'sans-serif']
      }
    },
  },
  plugins: [],
}
