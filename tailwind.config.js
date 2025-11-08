/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['IBM Plex Mono', 'monospace'],
      },
      colors: {
        bg: 'var(--bg)',
        text: 'var(--text)',
        border: 'var(--border)',
        accent: 'var(--accent)',
      },
    },
  },
  plugins: [],
};