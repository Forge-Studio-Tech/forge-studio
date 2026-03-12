/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        copper: {
          DEFAULT: '#D5851E',
          dark: '#B36A17',
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
