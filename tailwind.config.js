/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        copper: {
          DEFAULT: '#E8861B',
          dark: '#CC6F0E',
          light: '#F5A623',
        },
        forge: {
          bg: '#0c0a09',
          surface: '#161412',
          border: '#2a2420',
          text: '#f5f0eb',
          muted: '#78716c',
        },
        portal: {
          bg: 'var(--portal-bg)',
          surface: 'var(--portal-surface)',
          border: 'var(--portal-border)',
          text: 'var(--portal-text)',
          muted: 'var(--portal-muted)',
        },
        success: '#22c55e',
        warning: '#eab308',
        danger: '#ef4444',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
