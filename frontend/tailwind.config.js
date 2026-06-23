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
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb', // Primary
          700: '#1d4ed8',
          800: '#1e40af',
          950: '#172554',
        },
        secondary: {
          DEFAULT: '#0F172A',
          dark: '#020617',
        },
        accent: {
          DEFAULT: '#3B82F6',
          dark: '#2563EB',
        },
        darkbg: {
          DEFAULT: '#090d16',
          card: '#101625',
          border: '#1f293d',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
