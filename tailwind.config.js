/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        forge: {
          bg: '#0c0a09',
          surface: '#161412',
          border: '#2a2420',
          amber: '#d97706',
          'amber-light': '#f59e0b',
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
