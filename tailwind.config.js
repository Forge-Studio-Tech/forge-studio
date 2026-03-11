/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        copper: {
          DEFAULT: '#c8793b',
          dark: '#a8612d',
        },
        forge: {
          bg: '#0c0a09',
          surface: '#161412',
          border: '#2a2420',
          text: '#f5f0eb',
          muted: '#78716c',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
